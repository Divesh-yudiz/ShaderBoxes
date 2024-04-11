import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import MODEL from "../assets/bar.glb";
import MODELTexture from "../assets/texture-ambient-occlusion.png";
import MODELTexture1 from "../assets/texture-mask-graph.png";
import * as dat from 'dat.gui';
import stat1 from "../assets/state1.png";
import stat2 from "../assets/state2.jpg";
import gsap from 'gsap';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

let noise = `
//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   device.width / device.height,
    //   0.1,
    //   100
    // );
    // this.camera.position.set(0, 0, 2);


    let frustumSize = device.height;
    let aspect = device.width / device.height;
    // this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, -5000, 5000);
    // // this.camera.position.set(480, 1000, 480);
    // // this.camera.position.set(80,200,80); 
    // this.camera.position.set(896,1200,853); 
    // this.camera.rotation.set(-0.77, 0.59, 0.45);

    this.camera = new THREE.OrthographicCamera(device.width / - 2, device.width / 2, device.height / 2, device.height / - 2, 1, 10000);
    this.camera.position.set(5492, 2765, 3220);
    this.camera.rotation.set(-0.70, 0.93, 0.59);
    // scene.add(this.camera);

    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   device.width / device.height,
    //   0.1,
    //   2000
    // );
    // this.camera.position.set(300, 1200, 300);

    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      // preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    // this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    // this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();
    //create a function to get the mousewheel event and pass it to controls.zoom()
    this.setupFBO()
    this.setLights();
    this.setGeometry();
    this.setupSettings()
    this.render();
    this.setResize();
  }

  setupFBO() {
    this.fbo = new THREE.WebGLRenderTarget(device.width, device.height);
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.fboScene = new THREE.Scene();
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: null },
        uState1: { value: new THREE.TextureLoader().load(stat1) },
        uState2: { value: new THREE.TextureLoader().load(stat2) },
        uFBO: { value: null },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.fboQuad = new THREE.PlaneGeometry(2, 2);
    this.fboQuad = new THREE.Mesh(this.fboQuad, this.fboMaterial);
    this.fboScene.add(this.fboQuad);
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    this.spotlight = new THREE.SpotLight(0xffe9e9, 60);
    this.spotlight.position.set(-100, 500, 800);
    let target = new THREE.Object3D();
    target.position.set(0, -80, 800);
    this.spotlight.target = target;
    this.spotlight.intensity = 500;
    this.spotlight.angle = 1;
    this.spotlight.penumbra = 1.5;
    this.spotlight.decay = 0.7;
    this.spotlight.distance = 3000;
    this.scene.add(this.spotlight);

  }

  setGeometry() {
    this.aoTexture = new THREE.TextureLoader().load(MODELTexture);
    this.aoTexture.flipY = false;
    this.material = new THREE.MeshPhysicalMaterial({ roughness: 0.75, map: this.aoTexture, aoMap: this.aoTexture, aoMapIntensity: 0.75 });

    this.debug = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ map: this.fbo.texture }));
    this.debug.position.set(0, 200, 0);
    // this.scene.add(this.debug);

    this.uniforms = {
      uTime: { value: 0 },
      // uFbo: { value: new THREE.TextureLoader().load(MODELTexture1) },
      uFbo: { value: null },
      aoMap: { value: this.aoTexture },
      light_colors: { value: new THREE.Color('#ffe9e9') },

      // ramp_color_one: { value: new THREE.Color('#1B1A55') },
      // ramp_color_two: { value: new THREE.Color('#1B1A55') },
      // ramp_color_three: { value: new THREE.Color('#9290C3') },
      // ramp_color_four: { value: new THREE.Color('#1B1A55') },


      ramp_color_one: { value: new THREE.Color('#2323B9') },
      ramp_color_two: { value: new THREE.Color('#000000') },
      ramp_color_three: { value: new THREE.Color('#000000') },
      ramp_color_four: { value: new THREE.Color('#000000') },
    }

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms = Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
      uniform sampler2D uFbo;
      uniform float uTime;
      attribute vec2 instanceUV;
      varying float vHeight;
      varying float vHeightUV;
      ${noise}
      `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
      #include <begin_vertex>
      float n = cnoise(vec3(instanceUV.x*5., instanceUV.y*5., uTime*0.5));
      transformed.y += n*90.;
      vHeightUV = clamp(position.y*2., 0.0, 1.0);
      vec4 transition = texture2D(uFbo, instanceUV);
      transformed *= transition.g; 
      transformed.y += transition.r * 100.;
      vHeight = transformed.y;
      `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
      #include <common>
      uniform vec3 light_colors;
      uniform vec3 ramp_color_one;
      uniform vec3 ramp_color_two;
      uniform vec3 ramp_color_three;
      uniform vec3 ramp_color_four;
      varying float vHeightUV;
      varying float vHeight;
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
      #include <color_fragment>

      // diffuseColor.rgb = vec3(1.,0.,0.);
      vec3 myColor = vec3(20.0 / 255.0, 20.0 / 255.0, 187.0 / 255.0);
      vec3 highlight = mix(ramp_color_one, ramp_color_four, vHeightUV);
      diffuseColor.rgb = myColor; 
      diffuseColor.rgb = mix(diffuseColor.rgb, ramp_color_three, vHeightUV);
      diffuseColor.rgb = mix(diffuseColor.rgb, highlight, clamp(vHeight/10., -3., 0.1));
      `
      )
    }


    this.loader = new GLTFLoader();
    this.loader.load(MODEL, gltf => {
      console.log(gltf.scene)
      this.model = gltf.scene.children[0];
      this.model.material = this.material;
      this.geometry = this.model.geometry;
      this.geometry.scale(30, 30, 30); // Set the scale of this.model to 40, 40, 40
      // this.scene.add(gltf.scene);

      this.iSize = 50;
      this.instances = this.iSize ** 2;
      this.instanceMesh = new THREE.InstancedMesh(this.geometry, this.material, this.instances);

      let dummy = new THREE.Object3D();
      let w = 45;
      let instanceUV = new Float32Array(this.instances * 2);
      for (let i = 0; i < this.iSize; i++) {
        for (let j = 0; j < this.iSize; j++) {
          instanceUV.set([i / this.iSize, j / this.iSize], (i * this.iSize + j) * 2);
          dummy.position.set(w * (i - this.iSize / 2), 0, w * (j - this.iSize / 2));
          dummy.updateMatrix();
          this.instanceMesh.setMatrixAt(i * this.iSize + j, dummy.matrix);
        }
      }

      this.geometry.setAttribute('instanceUV', new THREE.InstancedBufferAttribute(instanceUV, 2));

      this.scene.add(this.instanceMesh)
    });
  }

  setupSettings() {
    this.settings = {
      progress: 0
    }
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01).onChange((val) => {
      this.fboMaterial.uniforms.uProgress.value = val;
    });
    this.gui.addColor(this.uniforms.ramp_color_one, 'value').name('Color One');
    this.gui.addColor(this.uniforms.ramp_color_two, 'value').name('Color Two');
    this.gui.addColor(this.uniforms.ramp_color_three, 'value').name('Color Three');
    this.gui.addColor(this.uniforms.ramp_color_four, 'value').name('Color Four');
    // this.gui.add(this.camera.position, 'x', -2000, 7000).step(0.1);
    // this.gui.add(this.camera.position, 'y', -2000, 7000).step(0.1);
    // this.gui.add(this.camera.position, 'z', -2000, 7000).step(0.1);
    // this.gui.add(this.camera.rotation, 'x', -Math.PI, Math.PI).step(0.01);
    // this.gui.add(this.camera.rotation, 'y', -Math.PI, Math.PI).step(0.01);
    // this.gui.add(this.camera.rotation, 'z', -Math.PI, Math.PI).step(0.01);

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      gsap.to(this.settings, {
        progress: this.settings.progress + delta * 0.09,
        duration: 0.5,
        onUpdate: () => {
          this.fboMaterial.uniforms.uProgress.value = this.settings.progress;
        },
      });
    });
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    requestAnimationFrame(this.render.bind(this));
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.uniforms.uTime.value = elapsedTime;
    // console.log(this.camera.position)
    this.renderer.setRenderTarget(null);
    this.uniforms.uFbo.value = this.fbo.texture;
    this.renderer.render(this.scene, this.camera);

  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    // device.width = window.innerWidth;
    // device.height = window.innerHeight;

    // this.camera.aspect = device.width / device.height;
    // this.camera.updateProjectionMatrix();

    // this.renderer.setSize(device.width, device.height);
    // this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
