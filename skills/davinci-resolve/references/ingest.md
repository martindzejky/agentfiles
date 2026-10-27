# Ingest and media maintenance

## Inventory before import

Run on the host (from this skill directory):

```sh
python3 scripts/probe_media.py "/media/camera A.mov" "/media/recorder.wav" > /work/analysis/media.json
```

Choose an existing output directory separate from camera originals. The helper uses FFprobe and writes only stdout; its size/mtime identity is useful for change detection, not a content checksum. Preserve FFprobe's stream indices, `time_base`, `r_frame_rate`, `avg_frame_rate`, sample rates, channel layout, rotation/display matrix and timecode tags. Container duration and nominal frame rate can be misleading. Differing rate fields suggest investigation; they do not alone prove VFR. Inspect frame timestamps when sync/frame-accurate cutting requires it.

Use `inspect_session.py` for bin IDs/counts. For exact media targeting, read the selected folder's items:

```python
# folder is the bin resolved by ID from GetRootFolder()/GetSubFolderList().
result = [{"id": clip.GetUniqueId(), "name": clip.GetName(),
           "properties": clip.GetClipProperty(), "metadata": clip.GetMetadata()}
          for clip in folder.GetClipList() or []]
```

Confirm actual property keys before constructing an assembly plan. Nested/multicam/compound clips are not interchangeable with original media. Duplicate filenames are common; resolve by ID and verified path.

## Import into the intended bin

```python
pool = project.GetMediaPool()
previous = pool.GetCurrentFolder()
try:
    if not pool.SetCurrentFolder(destination):
        raise RuntimeError("cannot select destination bin")
    clips = pool.ImportMedia([{"FilePath": path} for path in paths])
    if not clips or len(clips) != len(paths):
        raise RuntimeError("partial import; inspect destination before retrying")
    result = [{"id": c.GetUniqueId(), "properties": c.GetClipProperty()} for c in clips]
finally:
    if not pool.SetCurrentFolder(previous):
        print("previous media-pool folder was not restored")
```

`destination` and `paths` must be resolved inputs. Import uses the current folder, not an invented destination argument. Use `AddSubFolder(parent, name)` to create a requested bin, check its return, and retain its ID. Decide project/timeline format before the first timeline; do not silently change an existing project's frame rate. Playback-rate settings can be read-only; consult the current docs instead of retrying value variants.

If import returns `None` or a partial list, inspect the bin before retrying to avoid duplicates. In the [local 21.1.1 trial](field-notes.md#local-native-mcp-trial), a valid WAV imported through the documented alternative:

```python
# Select the intended pool folder first, as above.
clips = resolve.GetMediaStorage().AddItemListToMediaPool([{"media": path}])
result = [{"id": c.GetUniqueId(), "properties": c.GetClipProperty()}
          for c in clips or []]
```

Match returned items to verified paths/IDs, not list order. Metadata alone does not prove an image decodes in the timeline: render-check imported stills. If a valid WebP fails there, a separate lossless PNG derivative is a measured fallback; preserve the original and verify the replacement's span/framing.

For image sequences, fetch `ImportMediaInfo` and the current `ImportMedia` documentation. Supply the documented sequence path pattern and `StartIndex`/`EndIndex`; explicitly distinguish a sequence from individual stills. Verify frame count/rate and first/last images after import.

## Metadata and annotations

Inspect `GetMetadata`, `GetClipProperty`, `GetMarkers`, `GetFlagList` and `GetClipColor` before editing. Use `SetMetadata` for known supported fields; technical property setters support only specific fields. Batch only the selected clips, check every boolean, and read values back. Do not write renamed filenames or source metadata on disk as an incidental organization step.

Markers on media and timelines have different coordinate origins. For review markers use distinctive `customData` to identify this workflow's annotations. Example for a resolved clip and verified frame:

```python
if not clip.AddMarker(frame, "Blue", "Review", note, 1, custom_data):
    raise RuntimeError("marker not created")
result = clip.GetMarkers()
```

Check the placed marker against the actual frame before batching. Update/remove only owned marker IDs/custom data; avoid `DeleteMarkersByColor("All")` for a scoped annotation task.

## Offline files, relink and proxies

Report media IDs, stored paths and host-side file availability. A missing volume is different from a moved file; wait for storage rather than relinking to a similarly named file. Match replacement candidates using path context, duration/rate, timecode, stream layout and, where needed, hashes.

Inspect `MediaPool.RelinkClips`, `MediaPoolItem.ReplaceClip`, `LinkProxyMedia`, `UnlinkProxyMedia`, and `LinkFullResolutionMedia` in the installed API. They perform different operations. For a checked directory relink, pass only the explicitly matched items, read their properties afterward, and scrub representative timeline frames/audio. Do not relink an entire bin to unverified candidates.

Proxy creation is a separate requested derivative workflow: preserve originals, naming/timecode, frame rate, aspect/rotation, channel layout and color interpretation. Probe the derivative, associate it with the intended original, and verify full-resolution/proxy switching. Do not assume a successful link proves matching content.
