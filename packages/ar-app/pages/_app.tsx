import { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>Welcome to ar-app!</title>
            </Head>
            <main className="App">
                <Component {...pageProps} />
            </main>
            <style global jsx>{`
                html,body,.App{
                    margin:0;
                    padding:0;
                    overflow:hidden;
                    width:100vw;
                    height:100vh;
                }
                .App{
                    display:flex;
                    flex-direction:column;
                }

            `}</style>
        </>
    );
}
