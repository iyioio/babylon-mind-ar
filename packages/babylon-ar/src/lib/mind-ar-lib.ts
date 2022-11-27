import { CancelToken, delayAsync } from '@iyio/common';

export type Landmark=number[];

export type Matrix=number[];

export interface EstimateResult{
    metricLandmarks:Landmark[],
    faceMatrix:Matrix,
    faceScale:number;
}

export interface UpdateEvent
{
    hasFace:boolean;
    estimateResult?:EstimateResult;
}

export interface ControllerOptions
{
    onUpdate?:(event:UpdateEvent)=>void;
    filterMinCF:number|null;
    filterBeta:number|null;
}

export interface CameraParams
{
    fov:number;
    aspect:number;
    near:number;
    far:number;
}

export interface MindArController
{
    onUpdate?:(event:UpdateEvent)=>void;
    getLandmarkMatrix(landmarkIndex:number):number[];
    setup(video:HTMLVideoElement):Promise<void>;
    dummyRun(video:HTMLVideoElement):Promise<void>;
    processVideo(video:HTMLVideoElement):void;
    getCameraParams():CameraParams;
    createThreeFaceGeometry(THREE:any):any;
}

export const createMindArController=(options:ControllerOptions):MindArController=>
{
    return new (globalThis as any).MINDAR.FACE.Controller(options);
}

export const loadMindArAsync=async (mindArScriptSrc=defaultMindArScriptSrc,cancel?:CancelToken)=>
{
    insertMindArScript(mindArScriptSrc);

    while(!(globalThis as any).MINDAR?.FACE?.Controller)
    {
        cancel?.throwIfCanceled();
        await delayAsync(5);
    }
}

export const defaultMindArScriptSrc='/mindar-face.prod.js';

export const insertMindArScript=(mindArScriptSrc=defaultMindArScriptSrc)=>{
    const id='_mindar_FP63msWGvDi2F9fmAUKn';
    if(document.getElementById(id)){
        return;
    }
    const script=document.createElement('script');
    script.id=id;
    script.src=mindArScriptSrc;
    document.head.append(script);
}
