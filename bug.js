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

    }

    set_pos(x, y, z)
    {
        this.root.location_matrix = Mat4.translation(x, y ,z);
        //this.root.location_matrix = Mat4.translation(x, y, z);
        //this.pos = vec3(x, y, z);

        //const pos = vec3(this.root.location_matrix[0][3], this.root.location_matrix[1][3], this.root.location_matrix[2][3]);
        
    }

    look_at(at)
    {
        const pos = vec3(this.root.location_matrix[0][3], this.root.location_matrix[1][3], this.root.location_matrix[2][3]);
        try {
            
            let z = at.minus (pos).normalized (),
              x = z.cross (vec3(0, 1, 0)).normalized (),
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
