import {tiny} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, Matrix } = tiny;

export class HermiteSpline
{
    constructor(points)
    {
        // TYPES:
        // HermitePoint[] points
        // HermitePoint[] knots
        // HermiteCurve[] this.hermiteCurves
        // Number this.precision
        
        this.knots = [...points];
        this.hermiteCurves = [];     
        this.arcLengthLookUp = [];  
        this.maxTableIndex = 100;
        
        // Generate a new Hermite curve with each additional point
        for(let i = 1; i < points.length; i++)
        {
            this.hermiteCurves.push(new HermiteCurve(points[i - 1].pos, points[i - 1].tan, points[i].pos, points[i].tan));
        }
        
        // Initialize look-up table
        for(let i = 0; i <= this.maxTableIndex; i++)
        {

            let diffFromLast = i == 0 ? 0 : this.getInterpolatedValue(i/this.maxTableIndex).minus(this.getInterpolatedValue((i - 1)/this.maxTableIndex));
            
            let distCovered = Math.sqrt(Math.pow(diffFromLast[0], 2) + Math.pow(diffFromLast[1], 2) + Math.pow(diffFromLast[2], 2));

            this.arcLengthLookUp[i] = { t: i/this.maxTableIndex, s: i == 0 ? 0 : this.arcLengthLookUp[i - 1].s + distCovered };
        }

        
    }

    getInterpolatedValue(t)
    {
        // TYPES:
        // Number t (0, 1)
        console.assert(t >= 0 && t <= 1);

        if(this.hermiteCurves.length == 0)
            return vec3(0, 0, 0);

        let t_prime = t * this.hermiteCurves.length;
        
        // Special case at the end of curve
        if(t == 1)
            return this.hermiteCurves[t_prime - 1].getInterpolatedValue(1);
        
        return this.hermiteCurves[Math.floor(t_prime)].getInterpolatedValue(t_prime % 1);

    }

    addPoint(newPoint)
    {
        // TYPES:
        // HermitePoint newPoint

        if(this.knots.length > 0)
        {
            this.hermiteCurves.push(new HermiteCurve(this.knots[this.knots.length - 1].pos, 
                this.knots[this.knots.length - 1].tan,
                newPoint.pos,
                newPoint.tan
            ));
        }
        
        
        this.knots.push(newPoint);

        this.recalculateLookUp();
    }

    resetHermitePoint(i, newPoint)
    {
        // TYPES:
        // Number i
        // HermitePoint newPoint

        this.knots[i].pos = newPoint.pos;
        this.knots[i].tan = newPoint.tan;

        if(i < this.knots.length - 1)
        {
            this.hermiteCurves[i] = new HermiteCurve(this.knots[i].pos, this.knots[i].tan, this.knots[i + 1].pos, this.knots[i + 1].tan);
        }

        if(i > 0)
        {
            this.hermiteCurves[i - 1] = new HermiteCurve(this.knots[i - 1].pos, this.knots[i - 1].tan, this.knots[i].pos, this.knots[i].tan);
        }

        this.recalculateLookUp();
    }

    recalculateLookUp(precision = this.maxTableIndex)
    {
        // TYPES:
        // Number precision

        // Resize the array down (if necessary) so that this.arcLengthLookUp.length always gives the index of the last entry (Which should be t = 1)
        let entryNumDelta = this.maxTableIndex - precision;
        this.maxTableIndex = precision; 
        for(let k = 0; k < entryNumDelta; k++)
        {
            this.arcLengthLookUp.pop();
        }

        // Reset the entire array using the new precision
        for(let i = 0; i <= precision; i++)
        {
            let diffFromLast = i == 0 ? 0 : this.getInterpolatedValue(i/precision).minus(this.getInterpolatedValue((i - 1)/precision));
            
            let distCovered = Math.sqrt(Math.pow(diffFromLast[0], 2) + Math.pow(diffFromLast[1], 2) + Math.pow(diffFromLast[2], 2));

            this.arcLengthLookUp[i] = { t: i/precision, s: i == 0 ? 0 : this.arcLengthLookUp[i - 1].s + distCovered };
        }
    }

    setTangent(i, tan)
    {
        // TYPES:
        // Number i
        // vec3 newTangent
        let pos = this.knots[i].pos;
 
        this.resetHermitePoint(i, new HermitePoint(pos[0], pos[1], pos[2], tan[0], tan[1], tan[2]));
    }

    setPoint(i, pos)
    {
        // TYPES:
        // Number i
        // vec3 newPosition
        
        let tan = this.knots[i].tan;

        this.resetHermitePoint(i, new HermitePoint(pos[0], pos[1], pos[2], tan[0], tan[1], tan[2]));
    }

    getArcLength()
    {
        return this.arcLengthLookUp[this.maxTableIndex].s;
    }

    getIntermediateArcLength(t)
    {
        if(t === 1)
            return this.getArcLength();

        const interval = 1/this.maxTableIndex;
        const i = Math.floor(t/interval);

        const percentAcrossInterval = (t - this.arcLengthLookUp[i].t)/interval;
        return ((percentAcrossInterval)*(this.arcLengthLookUp[i+1].s - this.arcLengthLookUp[i].s)) + this.arcLengthLookUp[i].s;
    }

    getParamForArcPercent(percent)
    {
        const s = percent * this.getArcLength();

        // Difference between desired arc length (s) and current
        const f = t => { return s - this.getIntermediateArcLength(t); };

        let threshold = 0.001;

        let low = 0;
        let high = 1;
        let mid = 0;

        while(true)
        {
            mid = (low + high)/2;
            let diff = f(mid);
            if(Math.abs(f(mid)) <= threshold)
                return mid;
            else if (f(mid)*f(high) <= 0)
                low = mid;
            else
                high = mid;
        }
    }
}

class HermiteCurve
{
    constructor(p0, m0, p1, m1)
    {
        this.h00 = (t) => {return 2*t**3 - 3*t**2 + 1;}
        this.h10 = (t) => {return t**3 - 2*t**2 + t;}
        this.h01 = (t) => {return -2*t**3 + 3*t**2;}
        this.h11 = (t) => {return t**3 - t**2;}

        this.p0 = p0;
        this.m0 = m0;
        this.p1 = p1;
        this.m1 = m1;

    }

    getInterpolatedValue(t)
    {
        return this.p0.times(this.h00(t)).plus(this.m0.times(this.h10(t))).plus(this.p1.times(this.h01(t))).plus(this.m1.times(this.h11(t)));
    }
}

export class HermitePoint
{
    constructor(x, y, z, sx, sy, sz)
    {
        this.pos = vec3(x, y, z);
        this.tan = vec3(sx, sy, sz);
    }
}