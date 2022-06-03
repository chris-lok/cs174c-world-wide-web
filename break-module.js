import { Particle, Spring } from "./part_two_spring.js";
import {tiny, defs} from './examples/common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export class BreakModule
{
    constructor(sim)
    {
        this.simulator = sim;
        this.strands = [];
    }

    modify_sim()
    {
        this.simulator.springs.forEach(s => {
            if(!this.strands.includes(s))
            {
                const curLen = s.particle_i.pos.minus(s.particle_j.pos).norm();
                const natLen = s.rest_length;

                const threshold = 2;
                if(curLen/natLen > threshold)
                {
                    const s1 = new Spring();
                    const p1 = new Particle();

                    const s2 = new Spring();
                    const p2 = new Particle();

                    const halfway = s.particle_i.pos.plus(s.particle_j.pos).times(0.5);
                    p1.set_particle(1, halfway, vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 0, 0));
                    p2.set_particle(1, halfway, vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 0, 0));
                    s1.set_spring(s.particle_i, p1, 1000, 1, natLen/2);
                    s2.set_spring(s.particle_j, p2, 1000, 1, natLen/2);

                    this.simulator.particles.push(p1, p2);
                    this.simulator.springs.push(s1, s2);
                    this.strands.push(s1, s2);

                    for(let i = 0; i < this.simulator.springs.length; i++)
                    {
                        if(this.simulator.springs[i] === s)
                        {
                            this.simulator.springs.splice(i, 1);
                        }
                    }
                }
            }

            
        });
    }
}