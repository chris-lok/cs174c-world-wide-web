import {tiny, defs} from './examples/common.js';
import {Simulation, Particle, Spring} from './part_two_spring.js';
import { math } from './tiny-graphics-math.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
class Spiderweb
{
    constructor(center = vec3(0, 0, 0), numberOfRings = 12, numberOfSides = 13, radiusLength = 6, spring_ks = 5000, spring_kd = 100, springRestLengthModifier = 0.9)
    {
        this.center = center;
        this.numberOfRings = numberOfRings;
        this.numberOfSides = numberOfSides;
        this.radiusLength = radiusLength;
        this.webParticleMass = 1;
        this.exteriorParticles = [];

        this.spring_ks = spring_ks;
        this.spring_kd = spring_kd;
        this.springRestLengthModifier = springRestLengthModifier;

        this.Simulation = new Simulation();
        this.Simulation.g_acc = vec3(0, -9.8, 0);
        this.Simulation.ground_ks = 500;
        this.Simulation.ground_kd = .1;
        this.Simulation.timestep = 0.001;

        //dont think my verlet integration implementation is right but it seems to work anyway
        //regular euler works very badly for this
        this.Simulation.integration_method = "verlet";
 
        this.place_particles();
        this.connect_with_springs(this.spring_ks, this.spring_kd, this.springRestLengthModifier); //spring ks, spring kd, rest length modifier
        //rest length of every spring is set to the distance between its particles * modifier
    }

    place_particles()
    {
        const zeroVector = vec3(0, 0, 0);
        const center_pos = this.center;
        const sideAngle = 360 / this.numberOfSides;

        // center particle of web, particle #0
        let centerParticle = new Particle();
        centerParticle.set_particle(this.webParticleMass, center_pos, zeroVector, zeroVector, zeroVector);
        this.Simulation.particles.push(centerParticle);

        //add rest of particles one side at a time
        let currentAngle = 0;
        while (currentAngle < 360)
        {
            let currentRing = 1;
            let segment_length = currentRing * this.radiusLength / this.numberOfRings;
            //if radius length = 6 and number of rings = 3:
                //segment lengths =  2, 4, 6

            //calc position of new particle based on angle
            const currentAngleRadians = currentAngle * Math.PI / 180;
            let x = segment_length * Math.cos(currentAngleRadians); 
            let z = segment_length * Math.sin(currentAngleRadians);
                        
            //place segments of one strand of the web
            while (currentRing <= this.numberOfRings)
            {
                let offset = vec3(x, 0, z).times(currentRing);
                let next_pos = center_pos.plus(offset)

                let particle_i = new Particle();
                particle_i.set_particle(this.webParticleMass, next_pos, zeroVector, zeroVector, zeroVector);
                this.Simulation.particles.push(particle_i);

                if (currentRing == this.numberOfRings)
                {
                    this.exteriorParticles.push(particle_i);
                }

                currentRing += 1;
            }    

            currentAngle += sideAngle;
        }
    }

    connect_with_springs(ks, kd, restLengthModifier)
    {
        //connect strands (diameters)
        let current_side = 0;
        while (current_side < this.numberOfSides)
        {
            const A = current_side * this.numberOfRings; //innermost particle index

            let particle_i = this.Simulation.particles[0];
            let particle_j = this.Simulation.particles[A + 1];
            let rest_length = (particle_i.pos.minus(particle_j.pos)).norm() * restLengthModifier //distance between points
            
            let s = new Spring();
            s.set_spring(particle_i, particle_j, ks, kd, rest_length);
            this.Simulation.springs.push(s);

            let current_ring = 1;
            while (current_ring < this.numberOfRings)
            {
                let particle_i = this.Simulation.particles[A + current_ring];
                let particle_j = this.Simulation.particles[A + current_ring + 1];
                let rest_length = (particle_i.pos.minus(particle_j.pos)).norm() * restLengthModifier //distance between points
                
                let s = new Spring();
                s.set_spring(particle_i, particle_j, ks, kd, rest_length);
                this.Simulation.springs.push(s);

                current_ring += 1;
            }
            current_side += 1;
        }

        //connect rings
        let current_ring = 1;
        while (current_ring < this.numberOfRings)
        {
            let current_side = 0;
            let A = current_ring; 
            while (current_side < this.numberOfSides)
            {
                if (current_side == (this.numberOfSides - 1)) //at the last particle in ring, connects to first particle 
                {
                    let particle_i = this.Simulation.particles[A];
                    let particle_j = this.Simulation.particles[current_ring];
                    let rest_length = (particle_i.pos.minus(particle_j.pos)).norm() * restLengthModifier //distance between points
                    
                    let s = new Spring();
                    s.set_spring(particle_i, particle_j, ks, kd, rest_length);
                    this.Simulation.springs.push(s);
    
                    current_side += 1;
                    A = A + this.numberOfRings;
                }
                else 
                {
                    let particle_i = this.Simulation.particles[A];
                    let particle_j = this.Simulation.particles[A + this.numberOfRings];
                    let rest_length = (particle_i.pos.minus(particle_j.pos)).norm() * restLengthModifier //distance between points
                    
                    let s = new Spring();
                    s.set_spring(particle_i, particle_j, ks, kd, rest_length);
                    this.Simulation.springs.push(s);
    
                    current_side += 1;
                    A = A + this.numberOfRings;
                }
            }

            current_ring += 1;
        }
    }
};










