
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";

import "../styles/CodeEditor.css";

// Monaco language identifiers
const languages = {
    cpp: "cpp",
    java: "java",
    python: "python",
    javascript: "javascript"
};

function CodeEditor() {
    const { roomId } = useParams();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [language, setLanguage] = useState("cpp");

    // Maintain separate code for every language
    const [codeByLanguage, setCodeByLanguage] = useState({});

    const [customInput, setCustomInput] = useState("");
    const [activeTab, setActiveTab] = useState("testcase");

    // Fetch problem from backend
    useEffect(() => {
        let ignore = false;

        const fetchProblem = async () => {
            try {
               const token = sessionStorage.getItem("token");

                if (!token) {
                    throw new Error("Please login first.");
                }

                const response = await fetch(
                    "http://localhost:5000/api/problems/two-sum",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch problem");
                }

                if (!data.success || !data.problem) {
                    throw new Error("Problem data is missing.");
                }

                if (!ignore) {
                    setProblem(data.problem);

                    // Load starter code from MongoDB
                    setCodeByLanguage(data.problem.starterCode || {});
                }

            } catch (error) {
                if (!ignore) {
                    setError(error.message);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchProblem();

        return () => {
            ignore = true;
        };
    }, []);

    // Change programming language
    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    // Update code for the currently selected language
    const handleCodeChange = (value) => {
        setCodeByLanguage((previousCode) => ({
            ...previousCode,
            [language]: value ?? ""
        }));
    };

    return (
        <div className="coding-page">

            {/* Navbar */}
            <nav className="coding-navbar">
                <h2>⚔️ CodeBattle</h2>

                <div className="coding-room-info">
                    <span>Room: {roomId}</span>
                    <span className="live-status">● Battle Room</span>
                </div>
            </nav>

            {/* Main workspace */}
            <main className="coding-workspace">

                {/* Problem panel */}
                <section className="problem-panel">

                    <div className="panel-heading">
                        <h2>Problem Description</h2>
                    </div>

                    <div className="problem-content">

                        {loading ? (
                            <p>Loading problem...</p>
                        ) : error ? (
                            <p>{error}</p>
                        ) : problem ? (
                            <>
                                <h1>{problem.title}</h1>

                                <div className="problem-tags">
                                    <span>{problem.difficulty}</span>

                                    {problem.tags?.map((tag, index) => (
                                        <span key={index}>{tag}</span>
                                    ))}
                                </div>

                                <p>{problem.description}</p>

                                {problem.examples?.map((example, index) => (
                                    <div key={example._id || index}>
                                        <h3>Example {index + 1}</h3>

                                        <pre>
                                            Input: {example.input}
                                            {"\n"}
                                            Output: {example.output}
                                            {example.explanation && (
                                                <>
                                                    {"\n"}
                                                    Explanation: {example.explanation}
                                                </>
                                            )}
                                        </pre>
                                    </div>
                                ))}

                                <h3>Constraints</h3>

                                <ul>
                                    {problem.constraints?.map((constraint, index) => (
                                        <li key={index}>{constraint}</li>
                                    ))}
                                </ul>
                            </>
                        ) : null}

                    </div>
                </section>

                {/* Editor panel */}
                <section className="editor-panel">

                    <div className="editor-toolbar">
                        <h3>Code Editor</h3>

                        <select
                            value={language}
                            onChange={handleLanguageChange}
                        >
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                    </div>

                    {/* Monaco Editor */}
                    <div className="monaco-container">

                        <Editor
                            height="100%"
                            language={languages[language]}
                            theme="vs-dark"
                            value={codeByLanguage[language] ?? ""}
                            onChange={handleCodeChange}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                padding: { top: 16 },
                                wordWrap: "on",
                                tabSize: 4
                            }}
                        />

                    </div>

                    {/* Input and Output panel */}
                    <div className="execution-panel">

                        <div className="execution-tabs">

                            <button
                                className={
                                    activeTab === "testcase" ? "active" : ""
                                }
                                onClick={() => setActiveTab("testcase")}
                            >
                                Testcase
                            </button>

                            <button
                                className={
                                    activeTab === "output" ? "active" : ""
                                }
                                onClick={() => setActiveTab("output")}
                            >
                                Output
                            </button>

                        </div>

                        {activeTab === "testcase" ? (

                            <div className="testcase-content">

                                <label>Custom Input</label>

                                <textarea
                                    value={customInput}
                                    onChange={(e) =>
                                        setCustomInput(e.target.value)
                                    }
                                    placeholder="Enter your custom input here..."
                                />

                            </div>

                        ) : (

                            <div className="output-content">
                                <p>
                                    Code execution will appear here once
                                    we integrate Judge0.
                                </p>
                            </div>

                        )}

                        <div className="execution-actions">
                            <button disabled>Run Code</button>
                            <button disabled>Submit</button>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
}

export default CodeEditor;
