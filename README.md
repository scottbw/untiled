untiled
=======

An RPG engine using Node JS. It doesn't use tiles :)

## Introduction

I was inspired originally by engines such as RPGMaker, but wondered if it was possible to break out of the constraints of using tilesets. I also wanted to experiment with an engine where all the "things" (players, mobs, objects, scenery) can be handled in the same way with scripts and capabilities. So any scenery item can start walking around, an event can turn a player temporarily into a mob, objects can be given dialogue, etc.


## Getting Started

1. Install Redis or similar document store ("brew install redis" on a Mac)
2. Clone the repo
3. Run "npm install" to install dependencies
4. Run "node game.js" to start the game engine

Navigate to localhost:3000 to play a demo

## How it works

An Untiled game consists of one or more _scenes_ written in JSON. 

Each scene has a background, some _stickers_, and _triggers_.

A _sticker_ is a character, object or other "thing" in the scene. Stickers can be animated, and can have  a _script_ and _dialogue_. Players are stickers. Mobs are stickers. Rocks are stickers.


A _trigger_ is a condition in a scene that causes an _event_, such as moving a sticker to another scene, making it say something, change the global game properties, or adding a _script_ to a sticker.

## Scripts

Scripts for movement have a _type_, such as PATH, RANDOM, FOLLOW or FLEE.

PATH scripts are of the form "N50E50*" - a set of directions, distances, and an optional loop around (the asterisk at the end there).

## Dialogue

Dialogue uses DialogueJS.
