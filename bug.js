import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

const shapes = {
    'sphere': new defs.Subdivision_Sphere( 5 ),
};

export
const Bug = 
class Bug {
    constructor() {
        const sphere_shape = shapes.sphere;

        // torso node
        const torso_transform = Mat4.scale(0.2, 0.2, 0.3);
        this.torso_node = new Node("torso", sphere_shape, torso_transform);
        // root->torso
        const root_location = Mat4.translation(0, 0, 0);
        this.root = new Arc("root", null, this.torso_node, root_location);

        // head node
        let head_transform = Mat4.scale(.1, .1, .1);
        head_transform.pre_multiply(Mat4.translation(0, 0, 0.10));
        this.head_node = new Node("head", sphere_shape, head_transform);
        // torso->neck->head
        const neck_location = Mat4.translation(0, 0, 0.3);
        this.neck = new Arc("neck", this.torso_node, this.head_node, neck_location);
        this.torso_node.children_arcs.push(this.neck);

        for(let k = 0; k < 2; k++)
        {
            const mult = (k == 0)? 1 : -1;  // Determines which side the legs go on
            for(let i = 0; i < 4; i++)
            {
                let uleg_transform = Mat4.scale(.1, .02, .02);
                uleg_transform.pre_multiply(Mat4.translation(0.1, 0, 0));
                const uleg_node = new Node("uleg" + i + "-" + k, sphere_shape, uleg_transform);
                const ujoint_location = Mat4.translation(0.1, 0, i*-0.1 + 0.1);
                const ujoint = new Arc("ujoint" + i + "-" + k, this.torso_node, uleg_node, ujoint_location);
                ujoint.articulation_matrix = Mat4.rotation(Math.PI * k, 0, 1, 0);
                ujoint.articulation_matrix.pre_multiply(Mat4.rotation(Math.PI/4, 0, 0, 1));
                this.torso_node.children_arcs.push(ujoint);

                let lleg_transform = Mat4.scale(.2, .02, .02);
                lleg_transform.pre_multiply(Mat4.translation(.15, 0 , 0));
                const lleg_node = new Node("lleg" + i + "-" + k, sphere_shape, lleg_transform);
                const ljoint_location = Mat4.translation(.2, 0, 0);
                const ljoint = new Arc("ljoint" + i + "-" + k, uleg_node, lleg_node, ljoint_location);
                ljoint.articulation_matrix = Mat4.rotation(-Math.PI/4, 0, 0, 1);
                uleg_node.children_arcs.push(ljoint);
            }
        }
        
        

    }

    set_pos(x, y, z)
    {
        this.root.location_matrix = Mat4.translation(x, y ,z);
        //this.root.location_matrix = Mat4.translation(x, y, z);
        //this.pos = vec3(x, y, z);

        //const pos = vec3(this.root.location_matrix[0][3], this.root.location_matrix[1][3], this.root.location_matrix[2][3]);
        
    }

    look_at(at, up)
    {
        const pos = vec3(this.root.location_matrix[0][3], this.root.location_matrix[1][3], this.root.location_matrix[2][3]);
        try {
            
            let z = at.minus (pos).normalized (),
              x = z.cross (up).normalized (),
              y = x.cross (z).normalized ();
            const rot = Mat4.of (x.to4 (0), y.to4 (0), z.to4 (0), vec4 (0, 0, 0, 1));
            this.root.articulation_matrix = rot;//
        } catch (error) {
            console.log(error);
        }   
        
    }

    draw(webgl_manager, uniforms, material) {
        this.matrix_stack = [];
        this._rec_draw(this.root, Mat4.identity(), webgl_manager, uniforms, material);
    }

    _rec_draw(arc, matrix, webgl_manager, uniforms, material) {
        if (arc !== null) {
            const L = arc.location_matrix;
            const A = arc.articulation_matrix;
            matrix.post_multiply(L.times(A));
            this.matrix_stack.push(matrix.copy());

            const node = arc.child_node;
            const T = node.transform_matrix;
            matrix.post_multiply(T);
            node.shape.draw(webgl_manager, uniforms, matrix, material);

            matrix = this.matrix_stack.pop();

            for (const next_arc of node.children_arcs) {
                this.matrix_stack.push(matrix.copy());
                this._rec_draw(next_arc, matrix, webgl_manager, uniforms, material);
                matrix = this.matrix_stack.pop();
            }
        }
    }


    debug(arc=null) {
        if (arc === null)
            arc = this.root;

        if (arc !== this.root) {
            arc.articulation_matrix = arc.articulation_matrix.times(Mat4.rotation(0.02, 0, 0, 1));
        }

        const node = arc.child_node;
        for (const next_arc of node.children_arcs) {
            this.debug(next_arc);
        }
    }
}

class Node {
    constructor(name, shape, transform) {
        this.name = name;
        this.shape = shape;
        this.transform_matrix = transform;  // This node's transform relative to its arc
        this.children_arcs = [];
    }
}

class Arc {
    constructor(name, parent, child, location) {
        this.name = name;
        this.parent_node = parent;
        this.child_node = child;
        this.location_matrix = location;        // Where this joint is located relative to the previous joint
        this.articulation_matrix = Mat4.identity();
    }
}
