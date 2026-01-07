import { useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

function Callback() {
  // react-oidc-context will process the URL and store the user.
  // We just show a tiny message and bounce home.
  const navigate = useNavigate();
  const auth = useAuth();

  useMemo(() => {
    // once auth finishes loading, return home
    if (!auth.isLoading) navigate("/", { replace: true });
  }, [auth.isLoading, navigate]);

  return (
    <div style={styles.card}>
      <h2>Signing you in…</h2>
      <p>If you get stuck here, check your redirect URI and IdP client settings.</p>
    </div>
  );
}

function Home() {
  const auth = useAuth();
  const [apiResult, setApiResult] = useState<string>("");

  const accessToken = auth.user?.access_token ?? "";

  async function callApi() {
    setApiResult("Calling API…");

    if (!accessToken) {
      setApiResult("No access token. Please sign in first.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_OIDC_API_BASE_URL}/protected`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const text = await res.text();
      setApiResult(`Status ${res.status}\n\n${text}`);
    } catch (e: any) {
      setApiResult(`Error calling API: ${e?.message ?? String(e)}`);
    }
  }

  function signIn() {
    // redirect flow (most reliable on iOS)
    auth.signinRedirect();
  }

  function signOut() {
    auth.signoutRedirect();
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>OIDC + OAuth2 (PKCE) Demo</h1>
        <p style={{ marginTop: 0 }}>
          This app uses <b>Authorization Code + PKCE</b> and shows a <b>Bearer access token</b>.
          Storage is <b>sessionStorage</b> (not localStorage) to be more iOS/Safari friendly.
        </p>

        {auth.isLoading && <p>Loading auth…</p>}

        {!auth.isLoading && auth.error && (
          <pre style={styles.pre}>
            Auth error:
            {"\n"}
            {String(auth.error)}
          </pre>
        )}

        {!auth.isLoading && !auth.isAuthenticated && (
          <>
            <p>Status: <b>Signed out</b></p>
            <button style={styles.btn} onClick={signIn}>
              Sign in (Redirect)
            </button>
          </>
        )}

        {!auth.isLoading && auth.isAuthenticated && (
          <>
            <p>Status: <b>Signed in</b></p>

            <div style={styles.row}>
              <button style={styles.btn} onClick={signOut}>
                Sign out
              </button>
              <button style={styles.btn} onClick={callApi}>
                Call protected API
              </button>
            </div>

            <h3>User (claims)</h3>
            <pre style={styles.pre}>
              {JSON.stringify(auth.user?.profile ?? {}, null, 2)}
            </pre>

            <h3>Access Token (Bearer)</h3>
            <pre style={styles.pre}>
              {accessToken ? accessToken : "(missing)"}
            </pre>

            <h3>API Result</h3>
            <pre style={styles.pre}>{apiResult || "(none yet)"}</pre>
          </>
        )}

        <hr style={{ margin: "18px 0" }} />

        <details>
          <summary>iOS/Safari notes</summary>
          <ul>
            <li>
              This demo uses <b>redirect login</b> (best reliability on iOS).
            </li>
            <li>
              It stores OIDC state/user in <b>sessionStorage</b>, not localStorage.
            </li>
            <li>
              If your IdP doesn’t support refresh tokens for SPAs, “silent renew” may fail on iOS
              due to cookie restrictions. In that case, prefer short sessions + re-login, or use a
              <b> backend-for-frontend (BFF)</b>.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback />} />
    </Routes>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 24,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    background: "#0b1220",
    color: "#e6edf3",
  },
  card: {
    width: "min(980px, 100%)",
    background: "#121a2b",
    border: "1px solid #24304a",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  btn: {
    background: "#2f81f7",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  pre: {
    background: "#0b1220",
    border: "1px solid #24304a",
    borderRadius: 12,
    padding: 12,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};
