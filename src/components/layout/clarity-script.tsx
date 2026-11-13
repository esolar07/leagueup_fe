import Script from "next/script";

const CLARITY_PROJECT_ID = "zd7ddjobmn";

/**
 * Microsoft Clarity. `afterInteractive` runs after instrumentation-client.ts has stripped any
 * emailed `#token=…` from the URL, so Clarity never records a token. Production builds only.
 */
export function ClarityScript() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
