import {tiny, defs} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;

// TODO: you should implement the required classes here or in another file.
function euler(current_pos, current_vel, current_acc, ext_force, mass, dt)
{
  //by this point, only force has been updated, so ext_force/m = new_acc, to be used at next update
  const new_acc = ext_force.times(1/mass);
  //according to slides, next vel = current vel + (timestep)(CURRENT acc)
  const new_vel = current_vel.plus(current_acc.times(dt));
  //according to slides, next pos = current pos + (timestep)(CURRENT vel)
  const new_pos = current_pos.plus(current_vel.times(dt));

  return [new_pos, new_vel, new_acc];
}

function symplectic(current_pos, current_vel, current_acc, ext_force, mass, dt)
{
  //by this point, only force has been updated, so ext_force/m = new_acc, to be used at next update
  const new_acc = ext_force.times(1/mass);
  //according to slides, next vel = current vel + (timestep)(CURRENT acc)
    //however, doing this did not match behavior of discussion examples without
    //using new_acc instead
  const new_vel = current_vel.plus(new_acc.times(dt));
  //according to slides, next pos = current pos + (timestep)(NEXT vel)
  const new_pos = current_pos.plus(new_vel.times(dt));

  return [new_pos, new_vel, new_acc];
}

function verlet(current_pos, prev_pos, current_vel, current_acc, ext_force, mass, dt)
{
  const new_acc = ext_force.times(1/mass);

  //verlet
  let new_pos = current_pos.times(2).minus(prev_pos);
  new_pos = new_pos.plus((new_acc).times(dt * dt));

  //update vel??? (need to keep updated for damper and ground collission calculations)
  let new_vel = new_pos.minus(current_pos).times(1/dt);

  return [new_pos, new_vel, new_acc];
}

function velocity_verlet(current_pos, prev_pos, current_vel, current_acc, ext_force, mass, dt)
{
  const new_acc = ext_force.times(1/mass);
  const new_pos = current_pos.plus(current_vel.times(dt)).plus(current_acc.times(dt * dt));
  const new_vel = current_vel.plus((current_acc.plus(new_acc)).times(dt/2));
  return [new_pos, new_vel, new_acc];

}

function viscoelastic_forces(particle_i, particle_j, ks, kd, rest_length)
{
  const dist_vec = particle_j.pos.minus(particle_i.pos);
  const dist = dist_vec.norm();
  const unit_dist_vec = dist_vec.times(1/dist);
  const rel_vel = particle_j.vel.minus(particle_i.vel);

  const spring_force = unit_dist_vec.times(dist - rest_length).times(ks);
  const damper_force = unit_dist_vec.times(rel_vel.dot(unit_dist_vec)).times(kd);

  return spring_force.plus(damper_force);
}

function calculate_ground_forces(current_particle, ks, kd)
{
  let normal_force = vec3(0, 0, 0);

  const ground = vec3(0, 0, 0)
  const ground_normal = vec3(0, 1, 0);
  const ground_friction_direction = current_particle.vel.times(-1).normalized();

  const signed_dist = (current_particle.pos).minus(ground).dot(ground_normal);
  if (signed_dist < 0) //position crosses plane
  {
    let spring_force = ground_normal.times(-signed_dist).times(ks);
    
    //use ground_friction_direction as a normal instead of ground_normal
    let damper_force = ((current_particle.vel).dot(ground_friction_direction));
    damper_force = ground_friction_direction.times(damper_force).times(kd);

    normal_force = spring_force.minus(damper_force);
  }

  return normal_force;
}

export class Particle
{
  constructor()
  {
    this.mass = null;
    this.pos = null;
    this.prev_pos = null;
    this.vel = null;
    this.acc = null;
    this.ext_force = null;
    this.valid = false;
  }

  set_particle(mass, pos, vel, acc, ext_force)
  {
    if (mass !== null)
      this.mass = mass;
    
    if (pos !== null)
    {
      this.pos = pos;
      this.prev_pos = pos;
    }

    if (vel !== null)
      this.vel = vel;
    
    if (acc !== null)
      this.acc = acc;
    
    if (ext_force !== null)
      this.ext_force = ext_force;

    if (!([this.mass, this.pos, this.prev_pos, this.vel, this.acc, this.ext_force].includes(null)))
      this.valid = true;
  }

  set_position(pos)
  {
    this.pos = pos;
    this.prev_pos = pos;
  }

  update(dt, integration_method)
  {
    if (!this.valid)
    {
      throw "Particle initialization not complete."
    }

    
    if (integration_method == "euler")
    {
      const result = euler(this.pos, this.vel, this.acc, this.ext_force, this.mass, dt);
      this.prev_pos = this.pos;
      this.pos = result[0];
      this.vel = result[1];
      this.acc = result[2];
    }

    else if (integration_method == "symplectic")
    {
      const result = symplectic(this.pos, this.vel, this.acc, this.ext_force, this.mass, dt);
      this.prev_pos = this.pos;
      this.pos = result[0];
      this.vel = result[1];
      this.acc = result[2];

    }
    else if (integration_method == "verlet")
    {
      const result = verlet(this.pos, this.prev_pos, this.vel, this.acc, this.ext_force, this.mass, dt);
      this.prev_pos = this.pos;
      this.pos = result[0];
      this.vel = result[1];
      this.acc = result[2];
    }
    else if (integration_method == "velocity_verlet")
    {
      const result = velocity_verlet(this.pos, this.prev_pos, this.vel, this.acc, this.ext_force, this.mass, dt);
      this.prev_pos = this.pos;
      this.pos = result[0];
      this.vel = result[1];
      this.acc = result[2];
    }
  }
}

export class Spring
{
  constructor()
  {
    this.particle_i = null;
    this.particle_j = null;
    this.ks = null;
    this.kd = null;
    this.rest_length = null;
    this.valid = false;
  }

  set_spring(particle_i, particle_j, ks, kd, rest_length)
  {
    if (particle_i !== null)
      this.particle_i = particle_i;
    
    if (particle_j !== null)
      this.particle_j = particle_j;

    if (ks !== null)
      this.ks = ks;
    
    if (kd !== null)
      this.kd = kd;
    
    if (rest_length !== null)
      this.rest_length = rest_length;

    if (!([this.particle_i, this.particle_j, this.ks, this.kd, this.rest_length].includes(null)))
      this.valid = true;
  }

  update()
  {
    if (!this.valid)
    {
      throw "Spring initialization not complete."
    }

    const fe_ij = viscoelastic_forces(this.particle_i, this.particle_j, this.ks, this.kd, this.rest_length);

    this.particle_i.ext_force.add_by(fe_ij);
    this.particle_j.ext_force.subtract_by(fe_ij);

  }
}

export class Simulation
{
  constructor()
  {
    this.particles = [];
    this.springs = [];
    this.g_acc = vec3(0, 0, 0);
    this.ground_ks = 0;
    this.ground_kd = 0;

    this.integration_method = "";
    this.timestep = 0;
  }

  update(dt)
  {
    //update forces (ext and ground)
    for (const p of this.particles)
    {
      p.ext_force = this.g_acc.times(p.mass); //init force to 0, accumulate external gravitational force
      
      const ground_forces = calculate_ground_forces(p, this.ground_ks, this.ground_kd); 
      p.ext_force = p.ext_force.plus(ground_forces);
    }

    //update forces (viscoelastic)
    for (const s of this.springs)
    {
      s.update(); 
    }

    //update positions
    for(const p of this.particles)
    {
      p.update(dt, this.integration_method); 
    }
  }

  draw(webgl_manager, uniforms, shapes, materials)
  {
    const white = color(1, 1, 1, 1), red = color(1, 0, 0, 1);
    
    // draw particles
    // for (const p of this.particles)
    // {
    //   const pos = p.pos;
    //   let model_transform = Mat4.scale(0.2, 0.2, 0.2);
    //   model_transform.pre_multiply(Mat4.translation(pos[0], pos[1], pos[2]));
    //   shapes.ball.draw(webgl_manager, uniforms, model_transform, { ...materials.plastic, color: white});
    // }

    //draw springs
    for (const s of this.springs)
    {
      const p1 = s.particle_i.pos;
      const p2 = s.particle_j.pos;
      const len = (p2.minus(p1)).norm();
      const center = (p1.plus(p2)).times(0.5);

      let model_transform = Mat4.scale(0.05, len / 2, 0.05);

      const p = p1.minus(p2).normalized();
      let v = vec3(0, 1, 0);
      if (Math.abs(v.cross(p).norm()) < 0.1)
      {
        v = vec3(0, 0, 1);
        model_transform = Mat4.scale(0.05, 0.05, len/2);
      }
      const w = v.cross(p).normalized();

      const theta = Math.acos(v.dot(p));
      model_transform.pre_multiply(Mat4.rotation(theta, w[0], w[1], w[2]));
      model_transform.pre_multiply(Mat4.translation(center[0], center[1], center[2]));
      shapes.box.draw(webgl_manager, uniforms, model_transform, { ...materials.pure, color: white});
    }
  }
}

export
const Part_two_spring_base = defs.Part_two_spring_base =
    class Part_two_spring_base extends Component
    {                                          // **My_Demo_Base** is a Scene that can be added to any display canvas.
                                               // This particular scene is broken up into two pieces for easier understanding.
                                               // The piece here is the base class, which sets up the machinery to draw a simple
                                               // scene demonstrating a few concepts.  A subclass of it, Part_one_hermite,
                                               // exposes only the display() method, which actually places and draws the shapes,
                                               // isolating that code so it can be experimented with on its own.
      init()
      {
        console.log("init")

        this.hover = this.swarm = false;
        this.shapes = { 'box'  : new defs.Cube(),
          'ball' : new defs.Subdivision_Sphere( 4 ),
          'axis' : new defs.Axis_Arrows() };

        const phong = new defs.Phong_Shader();
        const tex_phong = new defs.Textured_Phong();
        this.materials = {};
        this.materials.plastic = { shader: phong, ambient: .2, diffusivity: 1, specularity: .5, color: color( .9,.5,.9,1 ) }
        this.materials.metal   = { shader: phong, ambient: .2, diffusivity: 1, specularity:  1, color: color( .9,.5,.9,1 ) }
        this.materials.rgb = { shader: tex_phong, ambient: .5, texture: new Texture( "assets/rgb.jpg" ) }
        this.materials.pure = {shader: phong, ambient: 1, diffusivity: 1, specularity: 0, color: color( .9,.5,.9,1 ) }

        this.ball_location = vec3(1, 1, 1);
        this.ball_radius = 0.25;


        this.Simulation = new Simulation();
        this.start_simulation = false;

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


export class Part_two_spring extends Part_two_spring_base
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
    const blue = color( 0,0,1,1 ), yellow = color( 1,1,0,1 );

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
    if(this.start_simulation)
    {
      const time_of_last_display = t;
      let t_sim = t;

      const dt_adjusted = Math.min(1/30, dt);
      // const dt_adjusted = Math.min(1/30, dt);
      const t_next = time_of_last_display + dt_adjusted;
      while (t_sim < t_next)
      {
        this.Simulation.update(this.Simulation.timestep);
        t_sim += this.Simulation.timestep;
      }
    }
    
    this.Simulation.draw(caller, this.uniforms, this.shapes, this.materials);
  }

  render_controls()
  {                                 // render_controls(): Sets up a panel of interactive HTML elements, including
    // buttons with key bindings for affecting this scene, and live info readouts.
    this.control_panel.innerHTML += "Part Two:";
    this.new_line();
    this.key_triggered_button( "Config", [], this.parse_commands );
    this.new_line();
    this.key_triggered_button( "Run", [], this.start );
    this.new_line();
  }

  _parse_line(line) {
    const words = line.trim().split(/\s+/);
    if (words[0] === "create" && words[1] == "particles")
    {
      const n = parseFloat(words[2]);
      
      for (let i = 0; i < n; i++)
      {
        this.Simulation.particles.push(new Particle());
        console.log("added particle");
      }
    }
    else if (words[0] === "particle")
    {
      const index = parseFloat(words[1]);
      const mass = parseFloat(words[2]);
      const x = parseFloat(words[3]);
      const y = parseFloat(words[4]);
      const z = parseFloat(words[5]);
      const vx = parseFloat(words[6]);
      const vy = parseFloat(words[7]);
      const vz = parseFloat(words[8]);

      this.Simulation.particles[index].mass = mass;
      this.Simulation.particles[index].pos = vec3(x, y, z);
      this.Simulation.particles[index].prev_pos = vec3(x, y, z);
      this.Simulation.particles[index].vel = vec3(vx, vy, vz);
      this.Simulation.particles[index].valid = true;
    }
    else if (words[0] == "all_velocities")
    {
      const vx = parseFloat(words[1]);
      const vy = parseFloat(words[2]);
      const vz = parseFloat(words[3]);

      for (const particle of this.Simulation.particles)
      {
        particle.vel = vec3(vx, vy, vz);
      }
    }
    else if (words[0] === "create" && words[1] == "springs")
    {
      const n = parseFloat(words[2]);
      
      for (let i = 0; i < n; i++)
      {
        this.Simulation.springs.push(new Spring());
        console.log("added spring");
      }
    }
    else if (words[0] === "link")
    {
      const sindex = parseFloat(words[1]);
      const pindex1 = parseFloat(words[2]);
      const pindex2 = parseFloat(words[3]);
      const ks = parseFloat(words[4]);
      const kd = parseFloat(words[5]);
      const length = parseFloat(words[6]);

      this.Simulation.springs[sindex].set_spring(this.Simulation.particles[pindex1], this.Simulation.particles[pindex2], ks, kd, length);
    }
    else if (words[0] === "integration")
    {
      const selection = words[1];
      const timestep = parseFloat(words[2]);
      this.Simulation.integration_method = selection;
      this.Simulation.timestep = timestep;

    }
    else if (words[0] === "gravity")
    {
      const g = parseFloat(words[1]);
      this.Simulation.g_acc = vec3(0, -g, 0);
    }
    else if (words[0] === "ground")
    {
      const ks = parseFloat(words[1]);
      const kd = parseFloat(words[2]);
      this.Simulation.ground_ks = ks;
      this.Simulation.ground_kd = kd;
    }
  }


  parse_commands() {
    let text = document.getElementById("input").value;
    const lines = text.split('\n');
    for (const line of lines) {
      try {
        this._parse_line(line);
      } catch (error) {
        console.error(error);
        document.getElementById("output").value = "invalid input for line: " + line + "\nerror is: " + error;
        return;
      }
    }
  }

  start() { // callback for Run button
    // document.getElementById("output").value = "start";
    this.start_simulation = !this.start_simulation;
    console.log(this.Simulation);
  }
}
