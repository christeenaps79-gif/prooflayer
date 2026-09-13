"use client";

import { useEffect, useRef, useState } from "react";
import { ParticlesSwarm } from "./ParticleSwarm";

type SystemIntroProps = {
    onEnter: () => void;
};

export default function SystemIntro({
    onEnter,
}: SystemIntroProps) {
    const canvasRef =
        useRef<HTMLDivElement>(null);

    const [ready, setReady] =
        useState(false);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const swarm =
            new ParticlesSwarm(
                canvasRef.current,
                12000
            );

        const timer =
            window.setTimeout(() => {
                setReady(true);
            }, 1800);

        return () => {
            window.clearTimeout(timer);
            swarm.dispose();
        };
    }, []);

    return (
        <main className="system-intro">

            {/* THREE.JS BACKGROUND */}

            <div
                ref={canvasRef}
                className="rift-background"
            />

            {/* DARK OVERLAY */}

            <div className="intro-overlay" />

            {/* TECHNICAL GRID */}

            <div className="intro-grid" />

            {/* MAIN CONTENT */}

            <section className="intro-content">

                <div className="system-mark">
                    <span className="mark-line" />

                    <span>
                        AI OPERATIONS / CONTROL PLANE
                    </span>
                </div>

                <div className="intro-status">
                    <span className="status-dot" />

                    SYSTEM INITIALIZING
                </div>

                <h1>
                    EXECUTION
                    <br />
                    CONTROL
                </h1>

                <p>
                    Secure execution records for
                    production AI systems.
                </p>

                <div className="intro-meta">

                    <div>
                        <span>
                            RUNTIME
                        </span>

                        <strong>
                            SIMULATOR
                        </strong>
                    </div>

                    <div>
                        <span>
                            INTEGRITY
                        </span>

                        <strong>
                            CRYPTOGRAPHIC
                        </strong>
                    </div>

                    <div>
                        <span>
                            ENGINE
                        </span>

                        <strong>
                            CooL
                        </strong>
                    </div>

                </div>

                <button
                    className="enter-console"
                    onClick={onEnter}
                    disabled={!ready}
                >
                    <span>
                        {ready
                            ? "ENTER CONTROL PLANE"
                            : "INITIALIZING SYSTEM"}
                    </span>

                    <span className="arrow">
                        →
                    </span>
                </button>

            </section>

            {/* FOOTER */}

            <div className="intro-footer">

                <span>
                    INTERNAL SECURITY SYSTEM
                </span>

                <span>
                    BUILD 01 / EXECUTION GOVERNANCE
                </span>

            </div>

            <style jsx global>{`

                * {
                    box-sizing: border-box;
                }

                .system-intro {
                    position: fixed;
                    inset: 0;
                    overflow: hidden;

                    background: #080b0d;
                    color: #e7ecee;

                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;

                    z-index: 9999;
                }

                .rift-background {
                    position: absolute;
                    inset: 0;
                }

                .rift-background canvas {
                    display: block;

                    width: 100%;
                    height: 100%;
                }

                .intro-overlay {
                    position: absolute;
                    inset: 0;

                    background:
                        linear-gradient(
                            90deg,
                            rgba(
                                8,
                                11,
                                13,
                                0.97
                            ) 0%,

                            rgba(
                                8,
                                11,
                                13,
                                0.78
                            ) 35%,

                            rgba(
                                8,
                                11,
                                13,
                                0.35
                            ) 70%,

                            rgba(
                                8,
                                11,
                                13,
                                0.72
                            ) 100%
                        );
                }

                .intro-grid {
                    position: absolute;
                    inset: 0;

                    opacity: 0.07;

                    background-image:
                        linear-gradient(
                            rgba(
                                120,
                                150,
                                150,
                                0.2
                            ) 1px,
                            transparent 1px
                        ),

                        linear-gradient(
                            90deg,
                            rgba(
                                120,
                                150,
                                150,
                                0.2
                            ) 1px,
                            transparent 1px
                        );

                    background-size:
                        64px 64px;

                    mask-image:
                        linear-gradient(
                            to right,
                            black,
                            transparent 85%
                        );
                }

                .intro-content {
                    position: absolute;

                    left: 9vw;
                    top: 50%;

                    transform:
                        translateY(-50%);

                    width:
                        min(
                            560px,
                            80vw
                        );
                }

                .system-mark {
                    display: flex;

                    align-items: center;

                    gap: 12px;

                    margin-bottom: 26px;

                    color: #8b999f;

                    font-family: monospace;

                    font-size: 10px;

                    font-weight: 600;

                    letter-spacing:
                        0.18em;
                }

                .mark-line {
                    width: 28px;
                    height: 1px;

                    background:
                        #57c8b3;
                }

                .intro-status {
                    display: inline-flex;

                    align-items: center;

                    gap: 8px;

                    margin-bottom: 20px;

                    color:
                        #69d49a;

                    font-family: monospace;

                    font-size: 10px;

                    letter-spacing:
                        0.12em;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;

                    border-radius: 50%;

                    background:
                        #69d49a;

                    box-shadow:
                        0 0 10px
                        rgba(
                            105,
                            212,
                            154,
                            0.5
                        );
                }

                .intro-content h1 {
                    margin: 0;

                    font-size:
                        clamp(
                            54px,
                            7vw,
                            100px
                        );

                    line-height: 0.88;

                    letter-spacing:
                        -0.065em;

                    font-weight: 650;
                }

                .intro-content p {
                    max-width: 430px;

                    margin:
                        28px 0 34px;

                    color:
                        #9aa7ad;

                    font-size: 15px;

                    line-height: 1.7;
                }

                .intro-meta {
                    display: flex;

                    gap: 34px;

                    margin-bottom: 38px;

                    padding-top: 20px;

                    border-top:
                        1px solid
                        rgba(
                            120,
                            140,
                            145,
                            0.18
                        );
                }

                .intro-meta div {
                    display: flex;

                    flex-direction: column;

                    gap: 7px;
                }

                .intro-meta span {
                    color:
                        #647177;

                    font-family: monospace;

                    font-size: 9px;

                    letter-spacing:
                        0.12em;
                }

                .intro-meta strong {
                    color:
                        #d6dddf;

                    font-family: monospace;

                    font-size: 10px;

                    font-weight: 500;

                    letter-spacing:
                        0.08em;
                }

                .enter-console {
                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    width: 290px;

                    height: 48px;

                    padding:
                        0 16px 0 19px;

                    border:
                        1px solid
                        #344248;

                    background:
                        rgba(
                            15,
                            20,
                            23,
                            0.82
                        );

                    color:
                        #dfe6e8;

                    cursor: pointer;

                    font-family: monospace;

                    font-size: 10px;

                    letter-spacing:
                        0.08em;

                    transition:
                        border-color
                        180ms ease,

                        background
                        180ms ease;
                }

                .enter-console:hover:not(
                    :disabled
                ) {
                    border-color:
                        #57c8b3;

                    background:
                        rgba(
                            25,
                            37,
                            38,
                            0.92
                        );
                }

                .enter-console:disabled {
                    cursor: wait;

                    opacity: 0.55;
                }

                .arrow {
                    color:
                        #57c8b3;

                    font-size: 18px;
                }

                .intro-footer {
                    position: absolute;

                    bottom: 24px;

                    left: 9vw;
                    right: 9vw;

                    display: flex;

                    justify-content:
                        space-between;

                    color:
                        #566269;

                    font-family: monospace;

                    font-size: 8px;

                    letter-spacing:
                        0.12em;
                }

                @media (
                    max-width: 700px
                ) {

                    .intro-content {
                        left: 7vw;
                    }

                    .intro-meta {
                        gap: 18px;
                    }

                    .intro-content h1 {
                        font-size: 58px;
                    }

                    .intro-footer {
                        left: 7vw;
                        right: 7vw;
                    }

                }

            `}</style>

        </main>
    );
}