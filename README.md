# Worldwide Web
![](images/demo.gif)

## Authors
- Cole Strain (005376979)
- Chris Lok (705328560)

## Theme
Worldwide Web is a WebGL project using the tiny-graphics-js library that simulates a spiderweb in nature. The web is subject to the effects of gravity and will also react to objects that collide with its vertices by sticking to them, causing the web to stretch and pull as objects weigh it down. If the web stretches too far, it can tear apart.

## Animation Algorithms
- Collision Detection
- Collision Resolution
- Mass-Spring-Damper Systems (Verlet Integration)

## Division of Work
### User Controls (Cole)
The user can specify launch position, launch velocity, and mass of balls. The user can also specify the number of rings, number of sides, and radius of the spiderweb. Finally, launch a ball with / using gravity simulated with verlet integration.\
The balls currently in use are kept track of with an array in its own class, and movement is made with verlet integration. Note that changing parameters of the spiderweb will reset everything in the scene.\
The control panel displays important stats that update with each frame update. The buttons are color-coded with their functionalities.

### Spiderweb Structure (Chris)
The spiderweb is a system of mass-spring-dampers simulated with verlet integration, adapted from Assignment 1 code. The vertices of the web are represented as particles, which are then connected by springs. To emulate the appearance of a web, particles are not rendered and springs are rendered as white boxes.\
The structure of the web is based on its user-defined parameters: number of rings, number of sides, and the radius length. Each ring of the web can be seen as a set of triangular slices, so the position of each vertex can be determined through the use of some trigonometric calculations, which use angle values derived from the number of sides and triangle side lengths from the number of rings and the radius length. A particle is created at each of those positions, and springs are added to connect certain ones together to form the web. Springs connect particles by following a pattern in the array that stores the particles.