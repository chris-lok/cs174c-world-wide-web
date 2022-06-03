import { Spring } from "./part_two_spring.js";
export class StickyModule
{
    constructor(sim)
    {
        this.projectiles = [];
        this.particles_stuck_to = [];
        this.springs = [];
        this.simulation = sim;
    }

    add_projectile(proj)
    {
        this.simulation.particles.push(proj);
        this.projectiles.push(proj);
    }

    modify_sim()
    {
        this.simulation.particles.forEach((p) => 
        {
            this.projectiles.forEach((proj) => 
            {
                // If it's not the ball itself nor a particle the ball is already stuck to
                if(proj !== p && !this.particles_stuck_to.includes(p) && !this.projectiles.includes(p))
                {
                    const stickDist = 0.2;
                    if(proj.pos.minus(p.pos).norm() < stickDist)
                    {
                        const stickySpring = new StickySpring();
                        stickySpring.set_spring(p, proj, 10000, 1, stickDist);
                        this.simulation.springs.push(stickySpring);
                        this.particles_stuck_to.push(p);
                    }
                }
            })
            
        })
    }
}

// Give a special identifier to those springs that are used to give the sticky illusion
class StickySpring extends Spring
{
    constructor()
    {
        super();
        this.isSticky = 1;
    }
}