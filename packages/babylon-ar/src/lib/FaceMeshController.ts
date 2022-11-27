import { CancelToken, unused } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { createMindArController, defaultMindArScriptSrc, loadMindArAsync, MindArController, UpdateEvent } from "./mind-ar-lib";

export type CameraMode='front'|'back';

export interface Anchor
{
    native?:any;
    landmarkIndex:number;
    setVisible(visible:boolean):void;
    setMatrix(matrix:number[]):void;
}
export interface Mesh
{
    native?:any;
    setVisible(visible:boolean):void;
    setMatrix(matrix:number[]):void;
}

export interface FaceMeshControllerOptions
{
    container:HTMLElement;
    mindArScriptSrc?:string;
}

export abstract class FaceMeshController
{
    protected mindController:MindArController|null=null;

    protected readonly options:Required<Readonly<FaceMeshControllerOptions>>;

    protected readonly anchors:Anchor[]=[];

    protected readonly faceMeshes:Mesh[]=[];

    private readonly _cameraMode:BehaviorSubject<CameraMode>=new BehaviorSubject<CameraMode>('front');
    public get cameraModeSubject(){return this._cameraMode}
    public get cameraMode(){return this._cameraMode.value}
    public set cameraMode(value:CameraMode){
        if(value==this._cameraMode.value){
            return;
        }
        this._cameraMode.next(value);
    }

    public constructor({
        container,
        mindArScriptSrc=defaultMindArScriptSrc
    }:FaceMeshControllerOptions)
    {
        this.options=Object.freeze({
            container,
            mindArScriptSrc
        });
        this._cameraMode.subscribe(()=>{
            if(this.isRunning){
                this.stop();
                this.startAsync();
            }
        })
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.stop();
        this._dispose();
    }

    protected _dispose()
    {
        // do nothing
    }

    public get isRunning(){return this.currentToken!==null}

    private currentToken:CancelToken|null=null;

    public async startAsync()
    {
        if(this.currentToken){
            return;
        }
        const cancel=new CancelToken();
        this.currentToken=cancel;

        await loadMindArAsync(this.options.mindArScriptSrc,cancel);
        cancel.throwIfCanceled();

        if(!this.mindController){
            this.mindController=createMindArController({
                filterMinCF:null,
                filterBeta:null,
                onUpdate:evt=>this.onUpdate(evt)
            })
        }

        await this.startVideoAsync(cancel);
        cancel.throwIfCanceled();

        await this.startArAsync(cancel);
        cancel.throwIfCanceled();

        await this._start(cancel);
    }

    protected _start(cancel:CancelToken):Promise<void>|void
    {
        unused(cancel);
        // do nothing
    }

    public stop()
    {
        if(!this.currentToken){
            return;
        }
        const cancel=this.currentToken;
        this.currentToken=null;
        cancel.cancelNow();
        this._stop(cancel);
    }

    protected _stop(cancel:CancelToken):void
    {
        unused(cancel);
        // do nothing
    }

    protected onUpdate(evt:UpdateEvent){
        const {hasFace,estimateResult}=evt;
        for (let i = 0; i < this.anchors.length; i++) {
            this.anchors[i].setVisible(hasFace);
        }
        for (let i = 0; i < this.faceMeshes.length; i++) {
            this.faceMeshes[i].setVisible(hasFace);
        }

        if (hasFace && estimateResult && this.mindController) {
            const { faceMatrix } = estimateResult;
            for (let i = 0; i < this.anchors.length; i++) {
                const landmarkIndex = this.anchors[i].landmarkIndex;
                const landmarkMatrix = this.mindController.getLandmarkMatrix(landmarkIndex);

                this.anchors[i].setMatrix(landmarkMatrix);
            }
            for (let i = 0; i < this.faceMeshes.length; i++) {

                this.faceMeshes[i].setMatrix(faceMatrix);
            }
        }
    }

    private _currentVideo:HTMLVideoElement|null=null;
    public get currentVideo(){return this._currentVideo}


    protected _startAr(cancel:CancelToken):Promise<void>|void
    {
        unused(cancel);
    }

    private async startArAsync(cancel:CancelToken){

        const video=this._currentVideo;
        const controller=this.mindController;
        if(!controller || !video){
            return;
        }

        this.resize();

        await controller.setup(video);
        cancel.throwIfCanceled();

        await this._startAr(cancel);
        cancel.throwIfCanceled();

        await controller.dummyRun(video);
        cancel.throwIfCanceled();

        this.resize();
        controller.processVideo(video);
    }

    private async startVideoAsync(cancel: CancelToken) {
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.style.position = 'absolute';
        video.style.top = '0px';
        video.style.left = '0px';
        video.style.zIndex = '-1';
        this.options.container.appendChild(video);
        this._currentVideo=video;
        cancel.onCancelOrNextTick(() => {
            video.remove();
            if(this._currentVideo===video){
                this._currentVideo=null;
            }
        });

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser does not support user media');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode:
                    this.cameraMode === 'front' ? 'face' : 'environment',
            },
        });

        video.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
            cancel.onCancelOrNextTick(() => {
                reject('canceled');
            });
            video.addEventListener('loadedmetadata', () => {
                video.setAttribute('width', String(video.videoWidth));
                video.setAttribute('height', String(video.videoHeight));
                resolve();
            });
        });
    }

    resize() {
        const container=this.options.container;
        const video=this._currentVideo;
        if (!video) return;

        let vw, vh; // display css width, height
        const videoRatio = video.videoWidth / video.videoHeight;
        const containerRatio = container.clientWidth / container.clientHeight;
        if (videoRatio > containerRatio) {
            vh = container.clientHeight;
            vw = vh * videoRatio;
        } else {
            vw = container.clientWidth;
            vh = vw / videoRatio;
        }

        video.style.top = -(vh - container.clientHeight) / 2 + 'px';
        video.style.left = -(vw - container.clientWidth) / 2 + 'px';
        video.style.width = vw + 'px';
        video.style.height = vh + 'px';
    }


}
