"""Offline behavior tests, not a simulation of Resolve's undocumented semantics."""

import copy
import json
from pathlib import Path
import runpy
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "skills" / "davinci-resolve" / "scripts"
validate = runpy.run_path(str(SCRIPTS / "validate_edit_plan.py"))["validate_plan"]
assemble = runpy.run_path(str(SCRIPTS / "assemble_ranges.py"))
assemble["assemble_ranges"].__globals__["validate_plan"] = validate
assemble = assemble["assemble_ranges"]
inspect = runpy.run_path(str(SCRIPTS / "inspect_timeline.py"))["inspect_timeline"]
session = runpy.run_path(str(SCRIPTS / "inspect_session.py"))["inspect_session"]
probe = runpy.run_path(str(SCRIPTS / "probe_media.py"))["probe"]


def plan():
    return {"version": 1, "project_id": "project", "timeline_name": "rough",
            "rate": [24000, 1001], "start_timecode": "01:00:00:00",
            "native_end": "inclusive",
            "sources": [{"id": "media", "path": "/source.mov", "rate": [24000, 1001],
                         "frames": 240, "kind": "plain", "cfr": True,
                         "has_video": True, "has_audio": True}],
            "ranges": [{"source_id": "media", "in": 24, "out": 72, "record": 0,
                        "media_type": kind, "track": 1, "link": "one"} for kind in (1, 2)]}


class Media:
    def GetUniqueId(self):
        return "media"

    def GetClipProperty(self):
        return {"File Path": "/source.mov", "Frames": "240", "FPS": "23.976"}


class Folder:
    def GetName(self):
        return "Root"

    def GetUniqueId(self):
        return "root"

    def GetSubFolderList(self):
        return []

    def GetClipList(self):
        return [Media()]


class Item:
    def __init__(self, info, index, bad_duration=False):
        self.info, self.index = info, index
        self.bad_duration = bad_duration
        self.links = []

    def GetUniqueId(self):
        return str(self.index)

    def GetName(self):
        return "source"

    def GetType(self):
        return "video" if self.info["mediaType"] == 1 else "audio"

    def GetClipEnabled(self):
        return self.info.get("enabled", True)

    def GetStart(self, precision=False):
        return self.info["recordFrame"]

    def GetDuration(self, precision=False):
        return self.info["endFrame"] - self.info["startFrame"] + (0 if self.bad_duration else 1)

    def GetEnd(self, precision=False):
        return self.GetStart() + self.GetDuration()

    def GetSourceStartFrame(self):
        return self.info["startFrame"]

    def GetSourceEndFrame(self):
        return self.info["endFrame"]

    def GetMediaPoolItem(self):
        return self.info["mediaPoolItem"]

    def GetLinkedItems(self):
        return self.links


class Timeline:
    def __init__(self, name):
        self.name, self.items = name, []
        self.settings = {"timelineFrameRate": "23.976"}
        self.tracks = {"video": 1, "audio": 1, "subtitle": 0}

    def GetUniqueId(self):
        return self.name

    def GetName(self):
        return self.name

    def SetSettings(self, settings):
        self.settings.update(settings)
        return True

    def GetSettings(self):
        return self.settings

    def SetStartTimecode(self, timecode):
        self.timecode = timecode
        return True

    def GetStartTimecode(self):
        return self.timecode

    def GetStartFrame(self):
        return 86400

    def GetEndFrame(self):
        return max((i.GetEnd() for i in self.items), default=self.GetStartFrame())

    def GetTrackCount(self, kind):
        return self.tracks[kind]

    def AddTrack(self, kind, subtype=None):
        self.tracks[kind] += 1
        return True

    def GetItemListInTrack(self, kind, track):
        return [i for i in self.items if i.GetType() == kind and i.info["trackIndex"] == track]

    def GetTrackName(self, kind, track):
        return kind + str(track)

    def GetIsTrackEnabled(self, kind, track):
        return kind != "audio"

    def SetClipsLinked(self, items, linked):
        for item in items:
            item.links = [i for i in items if i is not item]
        return True


class Project:
    def __init__(self, bad_duration=False, fail_append=0):
        self.timelines = [Timeline("original")]
        self.current = self.timelines[0]
        self.bad_duration, self.fail_append = bad_duration, fail_append
        self.calls = 0

    def GetUniqueId(self):
        return "project"

    def GetName(self):
        return "Project"

    def GetTimelineCount(self):
        return len(self.timelines)

    def GetTimelineByIndex(self, index):
        return self.timelines[index - 1]

    def GetCurrentTimeline(self):
        return self.current

    def SetCurrentTimeline(self, timeline):
        self.current = timeline
        return True

    def GetMediaPool(self):
        return self

    def GetRootFolder(self):
        return Folder()

    def CreateEmptyTimeline(self, name):
        timeline = Timeline(name)
        self.timelines.append(timeline)
        return timeline

    def AppendToTimeline(self, entries):
        self.calls += 1
        if self.calls == self.fail_append:
            return None
        item = Item(entries[0], self.calls, self.bad_duration)
        self.current.items.append(item)
        return [item]


class PlanTests(unittest.TestCase):
    def test_fractional_rate_and_explicit_av(self):
        self.assertEqual(validate(plan()), {"range_count": 2, "source_count": 1, "duration_frames": 48})
        equivalent = plan()
        equivalent["sources"][0]["rate"] = [48000, 2002]
        validate(equivalent)

    def test_reject_bad_inputs_before_mutation(self):
        mutations = [
            lambda p: p.update(native_end="guessed"),
            lambda p: p.update(start_timecode="99:99:99:99"),
            lambda p: p.update(project_id="other"),
            lambda p: p["sources"][0].update(rate=[24, 1]),
            lambda p: p["sources"][0].update(path="/wrong.mov"),
            lambda p: p["sources"][0].update(cfr=False),
            lambda p: p["sources"][0].update(kind="multicam"),
            lambda p: p["ranges"][0].update(**{"out": 241}),
            lambda p: p["ranges"][0].update(record=-1),
            lambda p: p["ranges"][0].update(track=True),
            lambda p: p["ranges"][0].update(source_id="missing"),
            lambda p: p["ranges"][0].update(source_id=[]),
            lambda p: p["ranges"].append(copy.deepcopy(p["ranges"][0])),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                candidate, project = plan(), Project()
                mutation(candidate)
                with self.assertRaises(ValueError):
                    assemble(project, candidate)
                self.assertEqual(project.GetTimelineCount(), 1)
                self.assertEqual(project.calls, 0)

    def test_new_timeline_offsets_audio_and_links(self):
        project = Project()
        result = assemble(project, plan())
        self.assertTrue(result["ok"], result)
        self.assertEqual(project.current.GetName(), "original")
        timeline = project.timelines[1]
        self.assertEqual(len(timeline.items), 2)
        self.assertEqual(timeline.items[0].GetStart(), 86400)
        self.assertEqual(timeline.items[0].GetSourceStartFrame(), 24)
        self.assertEqual(len(timeline.items[0].GetLinkedItems()), 1)
        self.assertEqual(project.timelines[0].items, [])

    def test_stop_after_readback_mismatch_retains_partial(self):
        project = Project(bad_duration=True)
        result = assemble(project, plan())
        self.assertFalse(result["ok"])
        self.assertIn("readback differs", result["error"])
        self.assertEqual(project.calls, 1)
        self.assertTrue(result["partial_timeline_retained"])
        self.assertEqual(project.current.GetName(), "original")

    def test_partial_api_failure_does_not_retry(self):
        project = Project(fail_append=2)
        result = assemble(project, plan())
        self.assertFalse(result["ok"])
        self.assertEqual(len(result["appended"]), 1)
        self.assertEqual(project.calls, 2)
        self.assertEqual(project.current.GetName(), "original")
        with self.assertRaisesRegex(ValueError, "already exists"):
            assemble(project, plan())

    def test_inspection_preserves_current_timeline_and_track_coverage(self):
        project = Project()
        assemble(project, plan())
        timeline = project.timelines[1]
        timeline.items[0].info["enabled"] = False
        extra = dict(timeline.items[0].info, startFrame=72, endFrame=95, recordFrame=86460)
        timeline.items.append(Item(extra, 3))
        report = inspect(project, {"project_id": "project", "timeline_id": "rough"})
        self.assertEqual(report["tracks"][0]["intervals"], [{"kind": "gap", "from": 86448, "to": 86460}])
        self.assertEqual(project.current.GetName(), "original")
        self.assertEqual(report["tracks"][0]["items"][0]["source_start"], 24)
        self.assertFalse(report["tracks"][0]["items"][0]["enabled"])
        self.assertFalse(next(t for t in report["tracks"] if t["type"] == "audio")["enabled"])

    def test_nested_overlap_reports_only_intersection(self):
        project = Project()
        timeline = project.current
        base = {"mediaType": 1, "trackIndex": 1, "mediaPoolItem": Media(), "startFrame": 0}
        timeline.items = [Item(dict(base, endFrame=99, recordFrame=0), 1),
                          Item(dict(base, endFrame=9, recordFrame=20), 2)]
        report = inspect(project, {"project_id": "project", "timeline_id": "original"})
        self.assertEqual(report["tracks"][0]["intervals"], [{"kind": "overlap", "from": 20, "to": 30}])

    def test_session_without_project(self):
        class Resolve:
            def GetVersionString(self):
                return "test"
        self.assertEqual(session(Resolve(), None), {"version": "test", "project": None})
        self.assertEqual(session(Resolve(), Project())["project"]["bins"][0]["clip_count"], 1)

    def test_combined_native_payload_contract(self):
        payload = "\n".join((SCRIPTS / name).read_text() for name in
                            ("validate_edit_plan.py", "assemble_ranges.py"))
        project = Project()
        context = {"__name__": "__main__", "resolve": object(), "project": project, "CONFIG": plan()}
        exec(compile(payload, "<native-payload>", "exec"), context)
        self.assertTrue(context["result"]["ok"])

    def test_plan_cli(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "plan.json"
            path.write_text(json.dumps(plan()))
            completed = subprocess.run(["python3", "-B", str(SCRIPTS / "validate_edit_plan.py"), str(path)],
                                       capture_output=True, text=True, check=True)
            self.assertEqual(json.loads(completed.stdout)["duration_frames"], 48)


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg/FFprobe not installed")
class MediaTests(unittest.TestCase):
    def test_synthetic_media_probe_and_signal_analysis(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "synthetic.mov"
            subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-f", "lavfi", "-i",
                            "testsrc2=size=160x90:rate=24:duration=1", "-f", "lavfi", "-i",
                            "anullsrc=r=48000:cl=stereo", "-t", "1", "-c:v", "mpeg4",
                            "-c:a", "pcm_s16le", str(path)], check=True, capture_output=True)
            before = path.read_bytes()
            report = probe(path)
            video = next(s for s in report["probe"]["streams"] if s["codec_type"] == "video")
            self.assertEqual(video["avg_frame_rate"], "24/1")
            self.assertEqual(video["nb_frames"], "24")
            completed = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", str(path),
                                        "-vn", "-af", "silencedetect=n=-35dB:d=0.1", "-f", "null", "-"],
                                       check=True, capture_output=True, text=True)
            self.assertIn("silence_start", completed.stderr)
            self.assertEqual(path.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
