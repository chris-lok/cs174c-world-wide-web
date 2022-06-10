# Worldwide Web
![](images/demo.gif)


## Authors
- Cole Strain (005376979)
- Chris Lok (705328560)
- Aaron Isara (905563052)
- Kaustuv Prateeq (305171127)

## Theme
Worldwide Web is a WebGL project using the tiny-graphics-js library that simulates a spiderweb in nature. The web is subject to the effects of gravity and will also react to objects that collide with its vertices by sticking to them, causing the web to stretch and pull as objects weigh it down. If the web stretches too far, it can tear apart.

## Animation Algorithms
- Collision Detection
- Collision Resolution
- Gravity
- Mass-Spring-Damper Systems (Verlet Integration)
- Splines 
- Articulated Bodies


## Division of Work
### User Controls (Cole)
The user can specify launch position, launch velocity, and mass of balls. The user can also specify the number of rings, number of sides, and radius of the spiderweb. Finally, launch a ball with / using gravity simulated with verlet integration.\
The balls currently in use are kept track of with an array in its own class, and movement is made with verlet integration. Note that changing parameters of the spiderweb will reset everything in the scene.\
The control panel displays important stats that update with each frame update. The buttons are color-coded with their functionalities.

### Spiderweb Structure (Chris)
The spiderweb is a system of mass-spring-dampers simulated with verlet integration, adapted from Assignment 1 code. The vertices of the web are represented as particles, which are then connected by springs. To emulate the appearance of a web, particles are not rendered and springs are rendered as white boxes.\
The structure of the web is based on its user-defined parameters: number of rings, number of sides, and the radius length. Each ring of the web can be seen as a set of triangular slices, so the position of each vertex can be determined through the use of some trigonometric calculations, which use angle values derived from the number of sides and triangle side lengths from the number of rings and the radius length. A particle is created at each of those positions, and springs are added to connect certain ones together to form the web. Springs connect particles by following a pattern in the array that stores the particles.

### Web Collision, Web Tear, and Spider (Aaron)

![](images/web_spider_demo.gif)

The web detects collision by looping through each of the nodes on the web every frame and checking the distance between the node and any of the projectiles deployed in the scene. This implementation has much room for improvement in terms of efficiency and can cause the simulation to slow down with too many projectiles. Once a "collision" is detected, a hidden spring is attached to the projectile and the web node it collided with to simulate "sticking" to the web. 

The web will break at locations where it stretches too far past a certain threshold. This feature is implemented by looping through each spring in the web and checking whether its current length has exceeded its natural length sufficiently. If so, then the spring is removed from the simulation. A feature that did not make it into the final version was the spawning in of springs to represent the broken strands of web, which was too buggy to keep in the project.

The spider is an articulated body composed of a simple torso and set of limbs that only moves and rotates from the root node. It follows a spline that updates with the shape of the web as it deforms due to being weighed down by projectiles in some areas. The spline uses points on the web from each of its radial lines. It moves smoothly along a closed path using the techniques explored in Assignment 1.

### Environment (Kaustuv)
![](images/above_view.PNG)

The likeability of this project depended highly on the environment in which our ideas were presented. The environment consists
of a minecraft-esque world where we chose vibrance and simplicity over complex graphics. It was important to note that it is 
incredibly easy to create something pleasing to the eye with simple shapes and vibrant colors than it is to make it look
complex and realistic. With these design ideas in mind, we created the environment.

The environment consists of the skybox, the trees and the floor. We used the predefined "yellow" and "phong" shaders and 
created the base for the project by scaling a cube. Turning up the ambience of the shaders made the project look less dull while under 
the environmental lighting borrowed from previous projects. Additionally, trees were created using the traditional ball and 
cube shapes defined in the Shapes library. These were scaled up to represent the trunks of the tree and the treetop 
respectively. For the skybox, one fix we found was to ignore lighting using the "pure" predefined material and turning its
ambience to 1. This gave us a material that didn't depend on shadows and acted as our desired material for the skybox. 
Instead of the traditional six sided skybox used in game design, we opted for a simple hollow sphere within which to place
our camera and our environment. We colored the sphere sky blue to fit our theme and made it a static object. 