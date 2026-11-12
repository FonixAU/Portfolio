// GLSL for the system map. Colours are display values; anything above 1 is picked up by the bloom pass.

export const NOISE = /* glsl */ `
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float vnoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+7.1;a*=.5;}return s;}`;

export const VERT = /* glsl */ `varying vec3 vO;varying vec3 vW;varying vec3 vN;
void main(){vO=normalize(position);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;

// Planet vertex shader: optional noise displacement (D) for lumpy silhouettes; supports instancing.
export const PVERT = NOISE + /* glsl */ `uniform float D;uniform float S;varying vec3 vO;varying vec3 vW;varying vec3 vN;
void main(){vec3 u=normalize(position);vec4 lp=vec4(position*(1.+D*(fbm(u*2.+S)*2.-1.)),1.);
#ifdef USE_INSTANCING
lp=instanceMatrix*lp;
#endif
vO=normalize(lp.xyz);vec4 w=modelMatrix*lp;vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;

// T: 0 rocky, 1 gas bands, 2 ocean world, 3 molten, 4 ice.  F: faceted normals.
export const PLANET = NOISE + /* glsl */ `uniform vec3 A;uniform vec3 Bc;uniform vec3 C;uniform int T;uniform float S;uniform float F;uniform mat4 modelMatrix;
varying vec3 vO;varying vec3 vW;varying vec3 vN;
float H(vec3 p){return fbm(p*2.4);}
void main(){vec3 p=vO+vec3(S,S*1.7,S*.3);float n=H(p);vec3 col;float glow=0.,spec=0.;
 vec3 Ng=normalize(vN);vec3 N=Ng;
 if(F>.5)N=normalize(cross(dFdx(vW),dFdy(vW)));
 else if(T!=1){ // relief: bend the normal along the slope of the height field
  const float e=.03;vec3 g=mat3(modelMatrix)*(vec3(H(p+vec3(e,0.,0.)),H(p+vec3(0.,e,0.)),H(p+vec3(0.,0.,e)))-n)/e;
  g-=dot(g,Ng)*Ng;float k=T==2?step(.515,n)*.22:T==3?.1:.2;N=normalize(Ng-g*k);}
 vec3 L=normalize(-vW),V=normalize(cameraPosition-vW);float ndl=dot(N,L),d=smoothstep(-.12,.7,ndl);
 if(T==0){col=mix(A,Bc,smoothstep(.36,.64,n));col=mix(col,C,smoothstep(.52,.7,fbm(p*7.))*.75);col*=.8+.4*fbm(p*18.);}
 else if(T==1){float b=vO.y*7.+fbm(p*1.6)*2.2;col=mix(A,Bc,.5+.5*sin(b));col=mix(col,C,smoothstep(.55,.8,fbm(vec3(p.x*2.,p.y*11.,p.z*2.)))*.6);
  col=mix(col,Bc*1.15,smoothstep(.62,.7,fbm(vec3(p.x*3.,p.y*5.,p.z*3.)+3.))*.5);}
 else if(T==2){float land=smoothstep(.5,.53,n);float cl=smoothstep(.54,.72,fbm(p*3.1+11.));
  vec3 sea=mix(A*.5,A*1.3,smoothstep(.3,.52,n));vec3 gnd=mix(Bc,Bc*vec3(.95,.8,.55),smoothstep(.4,.7,fbm(p*5.)));gnd=mix(gnd,vec3(.85),smoothstep(.66,.72,n));
  col=mix(sea,gnd,land);col=mix(col,C,smoothstep(.86,.93,abs(vO.y)+n*.2));
  spec=pow(max(dot(reflect(-L,Ng),V),0.),48.)*(1.-land)*(1.-cl)*.9;
  col=mix(col,vec3(1.),cl*.75);
  glow=land*(1.-cl)*(1.-d)*step(.7,vnoise(p*42.))*step(.5,fbm(p*5.+3.));}
 else if(T==3){float cr=1.-smoothstep(0.,.07,abs(n-.5));col=mix(A+.08*fbm(p*9.),Bc,cr);glow=cr;}
 else{col=mix(A,Bc,smoothstep(.3,.7,n));col=mix(col,C,smoothstep(.6,.62,fbm(vec3(p.x*9.,p.y*1.5,p.z*9.)))*.5);spec=pow(max(dot(reflect(-L,N),V),0.),24.)*.35;}
 float rim=pow(clamp(1.-dot(Ng,V),0.,1.),2.5);
 vec3 gc=T==2?vec3(1.6,1.2,.55):Bc*1.9;
 vec3 o=col*(.05+d*.88)+spec*d+glow*gc+rim*mix(Bc,vec3(.6,.8,1.),.5)*(.1+.55*d);
 if(T==2)o+=vec3(1.,.4,.15)*smoothstep(.3,0.,abs(ndl))*.1; // warm light along the terminator
 gl_FragColor=vec4(min(o,vec3(3.)),1.);}`;

export const ATMO = /* glsl */ `uniform vec3 C;varying vec3 vO;varying vec3 vW;varying vec3 vN;
void main(){vec3 V=normalize(cameraPosition-vW);float n=clamp(dot(normalize(vN),V),0.,1.);float a=n<.5?pow(n*2.,2.5):mix(1.,.1,smoothstep(.5,.72,n));
 float d=smoothstep(-.4,.6,dot(vN,normalize(-vW)));gl_FragColor=vec4(C,a*(.12+.88*d)*.6);}`;

// Rings with fine bands and a gap.
export const RING = /* glsl */ `uniform vec3 C;varying vec3 vP;varying vec3 vW;
float hash1(float x){return fract(sin(x*91.7)*43758.5);}
void main(){float t=(length(vP.xy)-1.4)/.9;float a=.18+.5*smoothstep(.3,.7,fract(t*4.+.2))+.2*hash1(floor(t*46.));
 a*=smoothstep(0.,.03,abs(t-.58)-.03)*smoothstep(0.,.06,t)*smoothstep(1.,.94,t);
 gl_FragColor=vec4(C*(.75+.5*hash1(floor(t*23.))),a);}`;

// Sun surface: convection cells, fine granulation, sunspots, bright faculae and limb darkening.
export const SUN = NOISE + /* glsl */ `uniform float t;varying vec3 vO;varying vec3 vW;varying vec3 vN;
void main(){vec3 V=normalize(cameraPosition-vW);float mu=clamp(dot(normalize(vN),V),0.,1.);
 vec3 flow=vec3(0.,t*.02,t*.012);
 vec3 q=vO*3.+fbm(vO*2.+flow)*1.2;
 float cells=fbm(q+flow);
 float gran=1.-abs(2.*vnoise(vO*34.+fbm(vO*9.+flow*3.)*2.)-1.);
 gran=pow(gran,.6);
 float spots=smoothstep(.66,.74,fbm(vO*2.3+vec3(4.,t*.004,0.)))*smoothstep(.75,.35,abs(vO.y));
 float fac=smoothstep(.6,.78,fbm(vO*6.-flow*2.))*(1.-mu);
 float heat=clamp(.25+.5*cells+.35*gran,0.,1.);
 vec3 col=mix(vec3(.85,.16,.02),vec3(1.45,.8,.22),heat);
 col=mix(col,vec3(1.9,1.5,.85),smoothstep(.78,1.,heat)*.6);
 col*=1.-spots*.85;col+=vec3(1.,.6,.25)*fac*.5;
 float limb=.3+.7*pow(mu,.5);col*=limb;col=mix(col,col*vec3(1.,.6,.35),1.-mu);
 gl_FragColor=vec4(col,1.);}`;

// Corona: a camera-facing quad, 4 sun radii across. Soft glow plus slow streamers.
export const CORONA = NOISE + /* glsl */ `uniform float t;varying vec2 u;
void main(){float d=length(u)*4.;if(d<.96){discard;}float a=atan(u.y,u.x);
 float ray=fbm(vec3(cos(a)*2.5,sin(a)*2.5,d*.9-t*.05))*fbm(vec3(cos(a)*7.,sin(a)*7.,t*.03+d*.4));
 float g=exp(-(d-1.)*2.6)*(.2+2.2*ray)+exp(-(d-1.)*11.)*.8;
 vec3 col=mix(vec3(1.,.32,.05),vec3(1.,.8,.45),exp(-(d-1.)*6.))*g;
 gl_FragColor=vec4(col*smoothstep(4.,2.4,d),1.);}`;

// Background: a faint, uneven band of dust and a few warm clouds. Kept dark so the bodies carry the scene.
export const SKY = NOISE + /* glsl */ `varying vec3 vO;
void main(){vec3 d=normalize(vO);float band=exp(-pow(d.y*2.4+.5*(fbm(d*2.)-.5),2.)*4.);
 float dust=fbm(d*3.+5.)*fbm(d*8.+1.);
 vec3 col=vec3(.09,.12,.2)*band*dust*1.5+vec3(.14,.06,.11)*pow(fbm(d*2.5+20.),4.)*.8+vec3(.03,.05,.08)*band*.25;
 gl_FragColor=vec4(col,1.);}`;
