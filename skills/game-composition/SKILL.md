---
name: game-composition
description: Apply my game architecture principles when designing, implementing, or reviewing objects, mechanics, their interactions, presentation, UI, or world orchestration in any engine.
---

# Game composition

I view a game as a world with distinct objects, mechanics, and rules. Their interactions create interesting things in the game and, hopefully, interesting choices for the player. I usually design from the bottom up, starting with individual objects in the world.

## Objects and components

Objects are black boxes to each other. Each object exposes a public API for reading its state, signals for reporting changes, and methods others can call to trigger something or let it know what happened. Nobody outside the object should access its internals.

I prefer constructing objects out of reusable, well-defined components, like lego pieces. Components are private parts of the object. A very simple object can have one root script that implements its behaviour and public API, with a few components inside. For more complex objects, components implement the behaviour. The root only exposes the public API and signals, and provides the glue needed to connect the components.

The same principles apply inside an object. A component has its own public API and private internals. Components can depend on each other, but communicate through those APIs. Use dependency injection so they receive the collaborators they need without making assumptions about their surroundings. Keep object-specific glue on the root or in a small, scoped glue component.

## State and decisions

I prefer state machines for managing an object's state and behaviour once it needs more than a very simple enum. I already have a stacked state machine implementation that I reuse across projects. Look for the existing implementation and follow its contract before introducing another one.

A state machine represents the current state and owns the behaviour. A decision tree owns decision making, which can be useful for an object with AI or several rules to consider. It can act as the object's brain and choose which state to enter. These are separate responsibilities that can work together.

A custom decision tree is a future direction, not an implementation I already have. Only introduce one when the object needs that kind of decision making. A state machine often suffices.

## Mechanics

I try to make individual mechanics independent black boxes too. Each runs in the simulation using its own rules and reports its state through a public API. Mechanics can be composed, with explicit dependencies where needed. Often this boundary comes from the design of the objects and their APIs, without needing a separate system for every mechanic.

## Simulation and presentation

Within an object, some components own the logic, state, data, and rules. Above them, presentation components display the result. This is how I think about frontend frameworks too, with data and logic underneath and a visual layer that presents them.

Sprites, animations, effects, and sounds derive from the simulation. Simulation components don't know about presentation components. If you disable all presentation, the simulation should still run correctly. This also allows presentation work to stop for objects outside the screen. Gameplay usually does not depend on a visual effect or animation finishing.

## UI

UI is another layer above the simulation. It reads objects' public state, listens for changes, and updates what the player sees. Player commands go through the objects' public methods, directly or through an owner that routes them. UI never reaches into object internals or duplicates their rules.

Objects may register with a global registry or report events through a global bus where that makes sense. UI can use these to find objects or observe the world, while still respecting each object's public API. Objects don't need to know about the UI. Delete the UI layer and the world should still function.

## Worlds and orchestration

Objects exist within a world, one plane of existence. A game may have several worlds, with an orchestrator above them managing which ones are running and handling transitions. For example, it can load the next world, perform a soft transition, and remove the old one.

These higher layers use public APIs too. An orchestrator can spawn objects, supply their required dependencies, and tell them what to do or which state to start in. Objects should receive the context they need instead of assuming a particular world or orchestrator exists.
