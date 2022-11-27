import { ThreeFaceMeshController } from "@iyio/babylon-ar";
import { useEffect, useState } from "react";
import { HemisphereLight, TextureLoader } from "three";

interface FaceMaskProps
{
    mask?:any;
}

export function FaceMask({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mask
}:FaceMaskProps){

    const [viewport,setViewport]=useState<HTMLElement|null>(null);

    useEffect(()=>{

        if(!viewport){
            return;
        }

        let m=true;

        const ctrl=new ThreeFaceMeshController({container:viewport});

        (async ()=>{

            await ctrl.startAsync();
            if(!m){return}

            const light = new HemisphereLight( 0xffffff, 0xbbbbff, 1 );
            ctrl.scene.add(light);

            const faceMesh = ctrl.addThreeFaceMesh();
            if(!faceMesh){
                return;
            }
            const texture = new TextureLoader().load('/assets/canonical_face_model_uv_visualization.png');
            faceMesh.material.map = texture;
            faceMesh.material.transparent = true;
            faceMesh.material.needsUpdate = true;
            ctrl.scene.add(faceMesh);

            ctrl.renderer.setAnimationLoop(() => {
                ctrl.renderer.render(ctrl.scene, ctrl.camera);
            });

        })()

        return ()=>{
            m=false;
            ctrl.dispose();
        }

    },[viewport])

    return (
        <div className="FaceMask">

            <div ref={setViewport} className="viewport"/>

            <style jsx>{`
                .FaceMask{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                }
                .viewport{
                    position:relative;
                    flex:1;
                }
            `}</style>
        </div>
    )

}
