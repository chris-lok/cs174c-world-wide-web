import { Bug } from './bug.js';
import {tiny, defs} from './examples/common.js';
import { HermiteSpline, HermitePoint } from './hermite-spline.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export class SpiderModule
{
    constructor(web)
    {
        this.web = web;
        this.spider = new Bug();
        this.spline = new HermiteSpline([]);
        
        for(let i = 0; i < web.numberOfSides + 1; i++)
        {
            this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        }
        // this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        // this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        // this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        // this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        // this.spline.addPoint(new HermitePoint(0, 0, 0, 0, 0, 0));
        //this.curve = new Curve_Shape((t) => {return this.spline.getIntermediateArcLength(t);}, 100);

        // const midRing = this.web.numberOfRings/2 + 1;
        // const quarterTurnNodes = (this.web.numberOfRings)*(this.web.numberOfSides-1)/4;
        // const east = this.web.Simulation.particles[midRing].pos;
        // const north = this.web.Simulation.particles[quarterTurnNodes + midRing].pos;
        // const west = this.web.Simulation.particles[2 * quarterTurnNodes + midRing].pos;
        // const south = this.web.Simulation.particles[3 * quarterTurnNodes + midRing].pos;
        // this.pts = [east, north, west, south, east];

        this.total_spider_time = 0;
    }
    
    Update(dt)
    {
        const midRing =  Math.floor((this.web.numberOfRings/2) + 1);
        this.pts = [];

        for(let i = 0; i < this.web.numberOfSides; i++)
        {
            this.pts.push(this.web.Simulation.particles[i*this.web.numberOfRings + midRing + i%3 - 1].pos);
        }
        this.pts.push(this.pts[0]);
        
        this.pts.forEach((v, i) => {
            const dir = vec3(v[2], v[1], v[0]).normalized().times(0.2);
            this.spline.resetHermitePoint(i, new HermitePoint(v[0], v[1], v[2], dir[0], dir[1], dir[2]));
        })

        const u = this.spline.getParamForArcPercent((this.total_spider_time/1000000)%1);
        //const lastPos = this.spline.getInterpolatedValue((u + 0.02)%1);
        const spiderPos = this.spline.getInterpolatedValue(u);
        const nextPos = this.spline.getInterpolatedValue((u + 0.01)%1);

        //const center = this.web.Simulation.particles[0].pos;
        this.spider.set_pos(spiderPos[0], spiderPos[1], spiderPos[2]);

        //const up = (spiderPos.cross(nextPos)).normalized();
        this.spider.look_at(nextPos, vec3(-1, 1, 0));
        
        this.total_spider_time += dt;
    }

    Draw(caller, uniforms, shapes, materials)
    {
        // const midRing = Math.floor(this.web.numberOfRings/2 + 1);
        // this.pts = [];
        // for(let i = 0; i < this.web.numberOfSides; i++)
        // {
        //     this.pts.push(this.web.Simulation.particles[i*this.web.numberOfRings + midRing + i%2].pos);
        // }
        // this.pts.push(this.pts[0]);

        const spider_color = color(0.3, 0.3, 0.3, 1);
        const red = color(1, 0, 0, 1);
        this.spider.draw(caller, uniforms, { ...materials.plastic, color: spider_color});

        // this.pts.forEach((v, i) => {
        //     shapes.ball.draw(caller, uniforms, Mat4.translation(v[0], v[1], v[2]).times(Mat4.scale(0.25, 0.25, 0.25)), { ...materials.plastic, color: red});
        // })

        //this.curve.draw(caller, uniforms);
        
    }
}