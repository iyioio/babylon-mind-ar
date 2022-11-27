import dynamic from "next/dynamic";

const FaceMask=dynamic(()=>import('../components/FaceMaskWrapper'),{ssr:false});

export default function Index()
{

    return (
        <div className="Index">

            <FaceMask/>

            <style jsx>{`
                .Index{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                }
            `}</style>
        </div>
    )

}
