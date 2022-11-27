import * as THREE from "three";
import { Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer } from "three";
import { FaceMeshController, FaceMeshControllerOptions } from "./FaceMeshController";

export class ThreeFaceMeshController extends FaceMeshController {

    public readonly renderer: WebGLRenderer;
    public readonly camera: PerspectiveCamera;
    public readonly scene: Scene;

    public constructor(options: FaceMeshControllerOptions) {
        super(options);

        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setPixelRatio(window.devicePixelRatio ?? 1);
        this.camera = new PerspectiveCamera();
        this.scene=new Scene();

        const canvas=this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '0';
        canvas.style.height = '0';

        this.options.container.appendChild(this.renderer.domElement);
    }

    protected override _dispose(): void {
        this.options.container.removeChild(this.renderer.domElement);
    }

    protected override _startAr(): void {
        const video = this.currentVideo;
        const controller = this.mindController;
        if (!video || !controller) {
            return;
        }

        const { fov, aspect, near, far } = controller.getCameraParams();
        this.camera.fov = fov;
        this.camera.aspect = aspect;
        this.camera.near = near;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(video.videoWidth, video.videoHeight);
    }

    addThreeFaceMesh() {
        const controller=this.mindController;
        if(!controller){
            return null;
        }
        const faceGeometry = controller.createThreeFaceGeometry(THREE);
        const faceMesh = new Mesh(
            faceGeometry,
            new MeshStandardMaterial({ color: 0xffffff })
        );
        faceMesh.visible = false;
        faceMesh.matrixAutoUpdate = false;
        this.faceMeshes.push({
            native:faceMesh,
            setVisible:v=>{
                faceMesh.visible=v;
            },
            setMatrix:m=>{
                faceMesh.matrix.set(
                    m[0],m[1],m[2],m[3],
                    m[4],m[5],m[6],m[7],
                    m[8],m[9],m[10],m[11],
                    m[12],m[13],m[14],m[15]
                )
            }
        });
        return faceMesh;
    }



    addThreeAnchor(landmarkIndex:number) {
        const group = new Group();
        group.matrixAutoUpdate = false;
        const anchor = {group, landmarkIndex, css: false};
        this.anchors.push({
            native:anchor,
            landmarkIndex,
            setMatrix:m=>{
                group.matrix.set(
                    m[0],m[1],m[2],m[3],
                    m[4],m[5],m[6],m[7],
                    m[8],m[9],m[10],m[11],
                    m[12],m[13],m[14],m[15]
                )
            },
            setVisible:v=>{
                group.visible=v;
            }
        });
        this.scene.add(group);
        return anchor;
    }

    override resize(): void {
        super.resize();
        const canvas=this.renderer.domElement;
        const video=this.currentVideo;
        if(!video){
            return;
        }
        canvas.style.position = 'absolute';
        canvas.style.top = video.style.top;
        canvas.style.left = video.style.left;
        canvas.style.width = video.style.width;
        canvas.style.height = video.style.height;
    }
}
