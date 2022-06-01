import {tiny, defs} from './examples/common.js';
import {Spiderweb} from './spiderweb.js';

const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

export
const Display_Scene_Base = defs.Display_Scene_Base =
    class Display_Scene_Base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, display_scene,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        this.hover = this.swarm = false;
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows() };

        // *** Materials: ***
        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }
        this.materials.pure = {shader: phong, ambient: 1, diffusivity: 1, specularity: 0, color: color( .9,.5,.9,1 ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;
      
        // spiderweb instance
        this.web = new Spiderweb(vec3(0, 1, 0), 12, 13, 6); //center position, #rings, #sides, radius
      }

      render_animation( caller )
      {       
        // display():  Called once per frame of animation.  We'll isolate out
        // the code that actually draws things into a subclass
                                                 
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if( !caller.controls )
        { this.animated_children.push( caller.controls = new defs.Movement_Controls( { uniforms: this.uniforms } ) );
          caller.controls.add_mouse_controls( caller.canvas );

          // !!! Camera changed here
          Shader.assign_camera( Mat4.look_at (vec3 (10, 10, 10), vec3 (0, 0, 0), vec3 (0, 1, 0)), this.uniforms );
        }
        this.uniforms.projection_transform = Mat4.perspective( Math.PI/4, caller.width/caller.height, 1, 100 );

        // *** Lights: *** Values of vector or point lights. 
        const t = this.t = this.uniforms.animation_time/1000;
        const angle = Math.sin( t );

        // const light_position = Mat4.rotation( angle,   1,0,0 ).times( vec4( 0,-1,1,0 ) ); !!!
        // !!! Light changed here
        const light_position = vec4(20 * Math.cos(angle), 20,  20 * Math.sin(angle), 1.0);
        this.uniforms.lights = [ defs.Phong_Shader.light_source( light_position, color( 1,1,1,1 ), 1000000 ) ];

        // draw axis arrows.
        // this.shapes.axis.draw(caller, this.uniforms, Mat4.identity(), this.materials.rgb);
      }
    }


export class Display_Scene extends Display_Scene_Base
{                                                    
  render_animation( caller )
  {                                          
    // Variables that are in scope for you to use:
    // this.shapes.box:   A vertex array object defining a 2x2x2 cube.
    // this.shapes.ball:  A vertex array object defining a 2x2x2 spherical surface.
    // this.materials.metal:    Selects a shader and draws with a shiny surface.
    // this.materials.plastic:  Selects a shader and draws a more matte surface.
    // this.lights:  A pre-made collection of Light objects.
    // this.hover:  A boolean variable that changes when the user presses a button.
    // shared_uniforms:  Information the shader needs for drawing.  Pass to draw().
    // caller:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().

    // Call the setup code that we left inside the base class:
    super.render_animation( caller );

    /**********************************
     Start coding down here!!!!
     **********************************/

    const blue = color( 0,0,1,1 ), yellow = color( 0.7,1,0,1 );

    const t = this.t = this.uniforms.animation_time/1000;
    const dt = this.dt = this.uniforms.animation_delta_time/1000;
    
    // !!! Draw ground
    let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 0.01, 10));
    this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

    // !!! Draw ball (for reference)
    // let ball_transform = Mat4.translation(this.ball_location[0], this.ball_location[1], this.ball_location[2])
        // .times(Mat4.scale(this.ball_radius, this.ball_radius, this.ball_radius));
    // this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.metal, color: blue } );


    // TODO: you should draw spline here.
    const time_of_last_display = t;
    let t_sim = t;
    const dt_adjusted = Math.min(1/30, dt);
    const t_next = time_of_last_display + dt_adjusted;

    while (t_sim < t_next)
    {

      //anchor some particles to a certain position
      // this.web.Simulation.particles[0].set_position(vec3(5, 8, 5));
      // this.web.Simulation.particles[12].set_position(vec3(8, 9, 8));
      // this.web.Simulation.particles[6].set_position(vec3(7, 9, 9));

      this.web.Simulation.update(this.web.Simulation.timestep);
      t_sim += this.web.Simulation.timestep;
    }

    this.web.Simulation.draw(caller, this.uniforms, this.shapes, this.materials);
  }

  render_controls()
  {                                 
    // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Display: (no buttons)";
    this.new_line();

    //add controls here
    //text parsing to choose spiderweb size and position?
  }
}
