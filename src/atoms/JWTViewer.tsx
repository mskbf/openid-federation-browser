import React, { useEffect, useState, useCallback } from "react";
import style from "../css/ContextMenu.module.css";
import { IconAtom } from "./Icon";
import { FormattedMessage } from "react-intl";
import { CodeViewer } from "./CodeViewer";
import axios from "axios";
import { HttpCapturePayload } from "../lib/openid-federation/types";  


export interface ECViewerProps {
  id: string;
  raw: string;
  decodedPayload: object;
  decodedHeader: object;
  validationFn?: (payload: object) => Promise<[boolean, string | undefined]>;
  headerValidationFn?: (header: object) => Promise<[boolean, string | undefined]>;
  schemaUrl?: string;
  headerSchemaUrl?: string;
  httpCapture?: HttpCapturePayload;
  selectedProtocol?: string;
}

export interface ApiTest {
  testName: string;
  description: string;
  applicable: boolean;
  type: string;
  message: string;
}


export const JWTViewer = ({
  id,
  raw,
  decodedPayload,
  decodedHeader,
  httpCapture,
  selectedProtocol
}: ECViewerProps) => {
  
  const [apiTests, setApiTests] = useState<ApiTest[]>([]);
  const [hasValidated, setHasValidated] = useState(false); 
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  
  const handleSendToApi = useCallback(async () => {
    if (!httpCapture) return;
    
    setSendStatus("sending");
    setHasValidated(false); 
    setApiError(null); 
    
    try {

      const payloadToSend = {
        ...httpCapture,
        protocol: selectedProtocol 
      };

      const response = await axios.post("http://localhost:8080/api/tests/openidfederationbrowser", payloadToSend, {
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("[DEBUG] Risposta API completa:", response.data);
      
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 2000);

      const testsList = response.data?.tests || [];
      setApiTests(testsList);
      setHasValidated(true); 
      
    } catch(error) { 
      if (axios.isAxiosError(error) && !error.response) {
        setApiError("API non raggiungibile");
      } else {
        setApiError("Error");
      }
      setSendStatus("error");
      setHasValidated(true); 
    }
  }, [httpCapture, selectedProtocol]); 

  useEffect(() => {
    if (httpCapture) {
      handleSendToApi();
    }
  }, [httpCapture, handleSendToApi]);

  const decodedPayloadStr = JSON.stringify(decodedPayload, null, 4);
  const decodedHeaderStr = JSON.stringify(decodedHeader, null, 4);

  const toggleTab = (tab: string) => {
    const show = tab === "header" ? "header" : "payload";
    const hide = tab === "header" ? "payload" : "header";

    const showElement = document.getElementById(`${id}-nav-${show}`);
    if (showElement) {
      showElement.classList.add("active");
      showElement.classList.add("show");
    }

    const showElementTab = document.getElementById(`${id}-nav-${show}-tab`);
    if (showElementTab) {
      showElementTab.classList.add("active");
    }

    const hideElement = document.getElementById(`${id}-nav-${hide}`);
    if (hideElement) {
      hideElement.classList.remove("active");
      hideElement.classList.remove("show");
    }

    const hideElementTab = document.getElementById(`${id}-nav-${hide}-tab`);
    if (hideElementTab) {
      hideElementTab.classList.remove("active");
    }
  };

  const headerFailedTests = apiTests.filter(test => {
    const desc = (test.testName || "").toLowerCase();
    return (desc.includes("head") || desc.includes("header")) && (test.message || "").toLowerCase().includes("failed");
  });

  const payloadFailedTests = apiTests.filter(test => {
    const desc = (test.testName || "").toLowerCase();
    return (desc.includes("body") || desc.includes("payload")) && (test.message || "").toLowerCase().includes("failed");;
  });

  const headerPassedTests = apiTests.filter(test => {
    const desc = (test.testName || "").toLowerCase();
    return (desc.includes("head") || desc.includes("header")) && (test.message || "").toLowerCase().includes("passed");;
  });

  const payloadPassedTests = apiTests.filter(test => {
    const desc = (test.testName || "").toLowerCase();
    return (desc.includes("body") || desc.includes("payload")) && (test.message || "").toLowerCase().includes("passed");;
  });
  
 // console.log("[DEBUG] JWTViewer id:", id, "httpCapture ricevuto:", httpCapture);
  return (
    <div className="container" style={{ width: "100%", padding: "14px 24px" }}>
      <div className="row" style={{ padding: "8px" }}>
        {hasValidated && (
          <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sendStatus.toLowerCase().includes("error") || apiTests[0]?.testName.toLowerCase().includes("error") ? (
          <div style={{ padding: '10px', color: '#b45309', backgroundColor: '#ffedd5', border: '1px solid #fdba74', borderRadius: '4px', fontWeight: 'bold' }}>
                  ⚠ {apiError || "Error"}
              </div>
            ) : (
            headerFailedTests.length === 0 ? (
              <div style={{ padding: '10px', color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', fontWeight: 'bold' }}>
                ✓ Header Valido
              </div>
            ) : (
              <details style={{ border: '1px solid #f5c6cb', borderRadius: '4px', background: '#f8d7da' }} open>
                <summary style={{ padding: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#721c24' }}>
                  ⚠ Header Non Valido: {headerFailedTests.length} Test Falliti e {headerPassedTests.length} Test Passati
                </summary>
                <div style={{ padding: '10px', borderTop: '1px solid #f5c6cb', backgroundColor: '#fff', maxHeight: '200px', overflowY: 'auto' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#721c24' }}>
                    {headerFailedTests.map((test, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        <strong>{test.testName}</strong><br />
                        <span style={{ fontSize: '0.9em' }}>{test.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )
            )}
            {sendStatus.toLowerCase().includes("error") || apiTests[0]?.message.toLowerCase().includes("error") ? (
            <div style={{ padding: '10px', color: '#b45309', backgroundColor: '#ffedd5', border: '1px solid #fdba74', borderRadius: '4px', fontWeight: 'bold' }}>
                 ⚠ {apiError || "Error"}
              </div>
            ): ( 
              payloadFailedTests.length === 0 ? (
              <div style={{ padding: '10px', color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', fontWeight: 'bold' }}>
                ✓ Payload Valido
              </div>
            ) : (
              <details style={{ border: '1px solid #f5c6cb', borderRadius: '4px', background: '#f8d7da' }} open>
                <summary style={{ padding: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#721c24' }}>
                  ⚠ Payload Non Valido: {payloadFailedTests.length} Test Falliti e {payloadPassedTests.length} Test Passati 
                </summary>
                <div style={{ padding: '10px', borderTop: '1px solid #f5c6cb', backgroundColor: '#fff', maxHeight: '200px', overflowY: 'auto' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#721c24' }}>
                    {payloadFailedTests.map((test, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        <strong>{test.testName}</strong><br />
                        <span style={{ fontSize: '0.9em' }}>{test.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )
          )}

          </div>
        )}
      </div>
      <div className="row" style={{ padding: "8px" }}>
        <div className="col-4">
          <button
            className="btn btn-primary btn-icon btn-xs py-1 px-1"
            title="Discovery"
            aria-label="Discovery"
            onClick={() => navigator.clipboard.writeText(raw)}
            data-testid="copy-raw-jwt-button"
          >
            <IconAtom
              iconID="#it-copy"
              className="icon-xs icon-white"
              isRounded={false}
            />
            <span className={style.contextAccordinButton}>Copy raw JWT</span>
          </button>
        </div>
        {httpCapture && ( 
          <div className="col-4">
            <button
              className="btn btn-primary btn-icon btn-xs py-1 px-1"
              title="Invia dati ad API"
              aria-label="Invia dati ad API"
              onClick={handleSendToApi}
              disabled={sendStatus === "sending"}
              data-testid="send-to-api-button"
            >
              <IconAtom
                iconID="#it-upload"
                className="icon-xs icon-white"
                isRounded={false}
              />
              <span className={style.contextAccordinButton}>
                {sendStatus === "idle" && "Invia dati ad API"}
                {sendStatus === "sending" && "Invio..."}
                {sendStatus === "sent" && "✓ Inviato"}
                {sendStatus === "error" && "Errore, riprova"}
              </span>
            </button>
          </div>
        )} 
      </div>
      <div className="row" style={{ padding: "8px" }}>
        <div className="col">
          <ul className="nav nav-tabs auto" data-testid="jwt-tabs">
            <li className="nav-item">
              <span
                data-testid="jwt-header-tab"
                className="nav-link active"
                id={`${id}-nav-header-tab`}
                role="tab"
                onClick={() => toggleTab("header")}
              >
                <span className={style.contextAccordinText}>
                  <FormattedMessage id="header" />
                </span>
              </span>
            </li>
            <li className="nav-item" data-testid="jwt-payload-li">
              <span
                data-testid="jwt-payload-tab"
                className="nav-link"
                id={`${id}-nav-payload-tab`}
                role="tab"
                onClick={() => toggleTab("payload")}
              >
                <span className={style.contextAccordinText}>
                  <FormattedMessage id="payload" />
                </span>
              </span>
            </li>
          </ul>
          <div className="tab-content" id="nav-tabContent">
            <div
              className="tab-pane fade show active"
              id={`${id}-nav-header`}
              role="tabpanel"
              aria-labelledby="nav-header-tab"
              data-testid="jwt-header-tab-content"
            >
              <CodeViewer language="json" code={decodedHeaderStr} />
            </div>
            <div
              className="tab-pane fade"
              id={`${id}-nav-payload`}
              role="tabpanel"
              aria-labelledby="nav-payload-tab"
              data-testid="jwt-payload-tab-content"
            >
              <CodeViewer language="json" code={decodedPayloadStr} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
