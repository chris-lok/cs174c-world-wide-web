import {tiny, defs} from './examples/common.js';
import {Simulation, Particle, Spring} from './part_two_spring.js';
import { math } from './tiny-graphics-math.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Balls
{
    constructor()
    {
        this.Simulation = new Simulation();
        this.Simulation.g_acc = vec3(0, -9.81, 0);
        this.Simulation.ground_ks = 500;
        this.Simulation.ground_kd = .1;
        this.Simulation.timestep = 0.001;
        this.Simulation.draw_particles = true;

        //dont think my verlet integration implementation is right but it seems to work anyway
        //regular euler works very badly for this
        this.Simulation.integration_method = "verlet";

        // Initialize with one particle that the user can move before dropping
    }

    push_ball(mass, pos, vel)
    {
        this.Simulation.particles.push(new Particle());
        this.Simulation.particles[this.Simulation.particles.length-1].set_particle(mass, pos, vel, vec3(0,0,0), vec3(0,0,0));
        return this.Simulation.particles[this.Simulation.particles.length-1];
    }
};










