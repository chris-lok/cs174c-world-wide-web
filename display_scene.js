import {tiny, defs} from './examples/common.js';
import { Particle } from './part_two_spring.js';
import {Spiderweb} from './spiderweb.js';
import { Balls } from './balls.js';
import { StickyModule } from './sticky-module.js';
import { BreakModule } from './break-module.js';

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
        this.materials.pure = {shader: phong, ambient: 1, diffusivity: 1, specularity: 0, color: color( 83/256, 171/256, 230/256, 1 ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;
      
        // spiderweb instantiation, mess with following web & simulation parameters for maybe better results:
         //center position, #rings, #sides, radius length, spring ks, spring kd, spring rest length modifier
        this.web = new Spiderweb(vec3(0, 4, 0), 12, 13, 6, 5000, 100, 0.9);  
        this.web.Simulation.integration_method = "verlet";
        this.web.Simulation.g_acc = vec3(0, -9.8, 0);
        this.web.Simulation.ground_ks = 500;
        this.web.Simulation.ground_kd = .1;
        this.web.Simulation.timestep = 0.001;


        this.web_exterior_positions = [];
        this.web.exteriorParticles.forEach((x, i) => this.web_exterior_positions.push(x.pos)); 

        // balls
        this.balls = new Balls();
        this.target_pos = vec3(0, 5, 0);
        this.target_vel = vec3(0, 0, 0);
        this.target_mass = 10;

        // STICKY MODULE INITIALIZATION
        this.sticky_module = new StickyModule(this.web.Simulation);
        this.break_module = new BreakModule(this.web.Simulation);
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

    const blue = color( 0,0,1,1 ), yellow = color( 0.7,1,0,1 ), brown1 = color(0.5, 0.25, 0.05, 0.7), brown2 = color(0.5, 0.25, 0.05, 1);

    const t = this.t = this.uniforms.animation_time/1000;
    const dt = this.dt = this.uniforms.animation_delta_time/1000;
    
    // !!! Draw ground
    {
      let floor_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(10, 1, 10));
      this.shapes.box.draw( caller, this.uniforms, floor_transform, { ...this.materials.plastic, color: yellow } );

      let tree1_transform = Mat4.translation(6.4, 5, 0).times(Mat4.scale(0.6, 5, 0.6));
      this.shapes.box.draw( caller, this.uniforms, tree1_transform, { ...this.materials.plastic, color: brown2 } );

      let tree2_transform = Mat4.translation(-6.4, 8, 0).times(Mat4.scale(1.1, 9, 1.1));
      this.shapes.box.draw( caller, this.uniforms, tree2_transform, { ...this.materials.plastic, color: brown2 } );

      let tree3_transform = Mat4.translation(-2, 3, 6).times(Mat4.scale(0.4, 3, 0.4));
      this.shapes.box.draw( caller, this.uniforms, tree3_transform, { ...this.materials.plastic, color: brown2 } );

      let tree4_transform = Mat4.translation(-2, 2.5, -6).times(Mat4.scale(0.3, 2.5, 0.3));
      this.shapes.box.draw( caller, this.uniforms, tree4_transform, { ...this.materials.plastic, color: brown1 } );

      let tree5_transform = Mat4.translation(-3, 2, -5).times(Mat4.scale(0.2, 2, 0.2));
      this.shapes.box.draw( caller, this.uniforms, tree5_transform, { ...this.materials.plastic, color: brown1 } );

      let tree6_transform = Mat4.translation(-2.2, 1.5, -5.6).times(Mat4.scale(0.15, 1.5, 0.15));
      this.shapes.box.draw( caller, this.uniforms, tree6_transform, { ...this.materials.plastic, color: brown1 } );

      let ball_transform = Mat4.translation(6.4, 8.1, 0).times(Mat4.scale(3, 2, 3));
      this.shapes.ball.draw( caller, this.uniforms, ball_transform, { ...this.materials.plastic, color: yellow } );

      let ball0_transform = Mat4.translation(6.4, 10.1, 0).times(Mat4.scale(2, 1.5, 2));
      this.shapes.ball.draw( caller, this.uniforms, ball0_transform, { ...this.materials.plastic, color: yellow } );

      let ball00_transform = Mat4.translation(6.4, 11.5, 0).times(Mat4.scale(1, 1, 1));
      this.shapes.ball.draw( caller, this.uniforms, ball00_transform, { ...this.materials.plastic, color: yellow } );

      let ball2_transform = Mat4.translation(-2, 5.1, 6).times(Mat4.scale(2, 1.5, 2));
      this.shapes.ball.draw( caller, this.uniforms, ball2_transform, { ...this.materials.plastic, color: yellow } );

      let ball3_transform = Mat4.translation(-6.4, 15, 0).times(Mat4.scale(7, 3, 7));
      this.shapes.ball.draw( caller, this.uniforms, ball3_transform, { ...this.materials.plastic, color: yellow } );

      let ball4_transform = Mat4.translation(-2.5, 4.5, -5.5).times(Mat4.scale(1.8, 1.3, 1.8));
      this.shapes.ball.draw( caller, this.uniforms, ball4_transform, { ...this.materials.plastic, color: yellow } );
    }
    // !!! Draw skysphere thing
    let sky_transform = Mat4.scale(50,50,50);
    this.shapes.ball.draw( caller, this.uniforms, sky_transform, { ...this.materials.pure } );

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
      
      //anchor exterior particles 
      for (var i = 0; i < this.web.exteriorParticles.length; i++)
      { this.web.exteriorParticles[i].set_position(this.web_exterior_positions[i]);}

      this.web.Simulation.update(this.web.Simulation.timestep);
      // this.balls.Simulation.update(this.balls.Simulation.timestep);
      this.sticky_module.modify_sim();
      this.break_module.modify_sim();
      t_sim += this.web.Simulation.timestep;
    }

    this.web.Simulation.draw(caller, this.uniforms, this.shapes, this.materials);
    this.balls.Simulation.draw(caller, this.uniforms, this.shapes, this.materials);

    // Draw target
    let target_transform = Mat4.translation(this.target_pos[0], this.target_pos[1], this.target_pos[2]).times(Mat4.scale(0.2,0.2,0.2));
    this.shapes.ball.draw(caller, this.uniforms, target_transform, { ...this.materials.plastic, color: blue});

    this.render_controls();

    // if (this.balls.Simulation.particles.length > 0)
    // {
    //   console.log("Velocity: " + this.balls.Simulation.particles[0].vel);
    // }
  }

  render_controls()
  {                                 
    // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML = "Ball controls:";
    this.new_line();

    //add controls here
    //text parsing to choose spiderweb size and position?
    this.control_panel.innerHTML += "- Ball position: " + this.target_pos;
    this.new_line();
    this.key_triggered_button( "Move Left", ["ArrowLeft"], this.move_left, "#326ba8");
    this.key_triggered_button( "Move Right", ["ArrowRight"], this.move_right, "#326ba8");
    this.key_triggered_button( "Move Down", ["k"], this.move_down, "#326ba8");
    this.key_triggered_button( "Move Up", ["i"], this.move_up, "#326ba8");
    this.key_triggered_button( "Move Backwards", ["ArrowDown"], this.move_back, "#326ba8");
    this.key_triggered_button( "Move Forwards", ["ArrowUp"], this.move_for, "#326ba8");
    this.new_line();
    this.control_panel.innerHTML += "- Ball velocity: " + this.target_vel;
    this.new_line();
    this.key_triggered_button( "Vel. Left", ["g"], this.vel_left, "#eddf15");
    this.key_triggered_button( "Vel. Right", ["j"], this.vel_right, "#eddf15");
    this.key_triggered_button( "Vel. Down", ["u"], this.vel_down, "#eddf15");
    this.key_triggered_button( "Vel. Up", ["t"], this.vel_up, "#eddf15");
    this.key_triggered_button( "Vel. Backwards", ["h"], this.vel_back, "#eddf15");
    this.key_triggered_button( "Vel. Forwards", ["y"], this.vel_for, "#eddf15");
    this.new_line();
    this.control_panel.innerHTML += "- Ball mass: " + this.target_mass;
    this.new_line();
    this.key_triggered_button( "Remove Mass", ["-"], this.remove_mass, "#1fed26");
    this.key_triggered_button( "Add Mass", ["="], this.add_mass, "#1fed26");
    this.new_line();
    this.key_triggered_button( "Drop Ball", ["/"], this.drop_ball, "#d11730");
  }

  move_ball(dir)
  {
    // console.log("Moving by " + dir.times(0.25));
    this.target_pos = this.target_pos.plus(dir.times(0.25));
  }
  move_left()  { this.move_ball(vec3(-1, 0, 0)); }
  move_right() { this.move_ball(vec3( 1, 0, 0)); }
  move_down()  { this.move_ball(vec3( 0,-1, 0)); }
  move_up()    { this.move_ball(vec3( 0, 1, 0)); }
  move_back()  { this.move_ball(vec3( 0, 0, 1)); }
  move_for()   { this.move_ball(vec3( 0, 0,-1)); }

  add_velocity(dir)
  {
    // console.log("Velocity changed by " + dir.times(0.25));
    this.target_vel = this.target_vel.plus(dir.times(0.25));
  }
  vel_left()  { this.add_velocity(vec3(-1, 0, 0)); }
  vel_right() { this.add_velocity(vec3( 1, 0, 0)); }
  vel_down()  { this.add_velocity(vec3( 0,-1, 0)); }
  vel_up()    { this.add_velocity(vec3( 0, 1, 0)); }
  vel_back()  { this.add_velocity(vec3( 0, 0, 1)); }
  vel_for()   { this.add_velocity(vec3( 0, 0,-1)); }

  remove_mass()
  {
    this.target_mass -= 0.25
  }
  add_mass()
  {
    this.target_mass += 0.25
  }

  drop_ball()
  {
    // console.log("Dropping ball");
    this.sticky_module.add_projectile(this.balls.push_ball(this.target_mass, this.target_pos, this.target_vel));
  }
}
