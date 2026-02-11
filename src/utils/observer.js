/**
 * GSAP Observer-driven “story” navigation:
 * - Page has multiple `.section` blocks.
 * - Each section contains step templates for the device screen: `<template class="step-template">...`
 * - Each section may contain outside templates: `<template class="outside-template" data-step="0" data-position="left">...`
 * - User navigates with wheel / touch / pointer drag / arrow keys.
 *
 * Required DOM:
 * - #device-content  : container where step content is rendered
 * - #outside-left/#outside-right/#outside-top/#outside-bottom : containers for outside content
 *
 * Data attributes:
 * - step-template:
 *    - data-enter: "left" | "right" | "center" (default: "center")
 * - outside-template:
 *    - data-step: number (which step shows this outside element)
 *    - data-position: "left" | "right" | "top" | "bottom"
 */

import gsap from "gsap";
import Observer from "gsap/Observer";

gsap.registerPlugin(Observer);
gsap.defaults({ overwrite: "auto" });

export function initObserver() {
    // -----------------------------
    // DOM lookups
    // -----------------------------
    const sections = gsap.utils.toArray(".section");
    const deviceContent = document.getElementById("device-content");

    const outsideLayers = {
        left: document.getElementById("outside-left"),
        right: document.getElementById("outside-right"),
        top: document.getElementById("outside-top"),
        bottom: document.getElementById("outside-bottom"),
    };

    // Basic safety: if core nodes are missing, don’t crash.
    if (!sections.length || !deviceContent) {
        console.warn("Observer: missing DOM nodes.");
        // Nothing to init
        return () => {};
    }

    // -----------------------------
    // Config (tweak here)
    // -----------------------------
    const OFFSCREEN_OFFSET = 40;

    const DURATION = {
        stepFadeOut: 0.08,
        stepEnter: 0.14,
        outsideEnter: 0.12,
        outsideExit: 0.10,
        sectionSlide: 0.22,
    };
    const EASE = {
        enter: "power2.out",
        exit: "power2.in",
        slide: "power2.inOut",
    };

    // -----------------------------
    // State
    // -----------------------------
    let sectionIndex = 0;
    let stepIndex = 0;
    let isAnimating = false;

    /** Track currently displayed outside nodes so we can animate-out and remove them cleanly */
    let activeOutside = []; // { node: HTMLElement, position: "left"|"right"|"top"|"bottom" }

    // -----------------------------
    // Helpers
    // -----------------------------
    function getStepTemplates(sectionEl) {
        return sectionEl.querySelectorAll(".step-template");
    }

    /**
     * Returns which step should be shown when we ENTER a section.
     * Rules:
     * - moving forward (direction > 0): start from step 1
     * - moving backward (direction < 0): start from last step
     *
     * Notes:
     * - if section has only 1 step, fallback to 0
     * - if section has 2+ steps and forward wants step 1 -> ok
     */
    function getEntryStepIndex(sectionEl, direction) {
        const steps = getStepTemplates(sectionEl);
        const last = Math.max(steps.length - 1, 0);

        if (direction > 0) {
            return Math.min(1, last); // step 1 if exists, else 0
        }

        return last; // last step for backward
    }

    function getOutsideTemplates(sectionEl) {
        return sectionEl.querySelectorAll(".outside-template");
    }

    function getFromVarsForPosition(position) {
        const from = { opacity: 0, x: 0, y: 0 };
        if (position === "left") from.x = -OFFSCREEN_OFFSET;
        if (position === "right") from.x = OFFSCREEN_OFFSET;
        if (position === "top") from.y = -OFFSCREEN_OFFSET;
        if (position === "bottom") from.y = OFFSCREEN_OFFSET;
        return from;
    }

    function getToVarsForPosition(position) {
        const to = { opacity: 0, x: 0, y: 0 };
        if (position === "left") to.x = -OFFSCREEN_OFFSET;
        if (position === "right") to.x = OFFSCREEN_OFFSET;
        if (position === "top") to.y = -OFFSCREEN_OFFSET;
        if (position === "bottom") to.y = OFFSCREEN_OFFSET;
        return to;
    }

    // -----------------------------
    // Outside content (left/right/top/bottom)
    // -----------------------------
    function hideOutside() {
        if (!activeOutside.length) return;

        activeOutside.forEach(({ node, position }) => {
            gsap.killTweensOf(node);
            gsap.to(node, {
                ...getToVarsForPosition(position),
                duration: DURATION.outsideExit,
                ease: EASE.exit,
                onComplete: () => node.remove(),
            });
        });

        activeOutside = [];
    }

    /**
     * Shows all outside templates that match the given step.
     * Each template is appended to its position layer and animated in.
     */
    function showOutside(sectionEl, step) {
        const templates = getOutsideTemplates(sectionEl);

        templates.forEach((tpl) => {
            const tplStep = Number(tpl.dataset.step);
            if (tplStep !== step) return;

            const position = tpl.dataset.position;
            const layer = outsideLayers[position];
            if (!layer) return;

            const node = tpl.content.firstElementChild?.cloneNode(true);
            if (!node) return;

            layer.appendChild(node);

            gsap.fromTo(
                node,
                getFromVarsForPosition(position),
                {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    duration: DURATION.outsideEnter,
                    ease: EASE.enter,
                }
            );

            activeOutside.push({ node, position });
        });
    }

    // -----------------------------
    // Device content (steps inside the “device”)
    // -----------------------------
    function renderDeviceStep(sectionEl, step) {
        gsap.killTweensOf(deviceContent.children);
        const templates = getStepTemplates(sectionEl);
        const tpl = templates[step];
        if (!tpl) return;

        const node = tpl.content.firstElementChild?.cloneNode(true);
        if (!node) return;

        // Optional direction for entering the device content
        const enter = tpl.dataset.enter || "center";
        let fromX = 0;
        if (enter === "left") fromX = -OFFSCREEN_OFFSET;
        if (enter === "right") fromX = OFFSCREEN_OFFSET;

        isAnimating = true;

        // Fade out current content, replace DOM, then animate in new content
        gsap.to(deviceContent.children, {
            opacity: 0,
            duration: DURATION.stepFadeOut,
            onComplete: () => {
                deviceContent.innerHTML = "";
                deviceContent.appendChild(node);

                gsap.fromTo(
                    node,
                    { opacity: 0, x: fromX },
                    {
                        opacity: 1,
                        x: 0,
                        duration: DURATION.stepEnter,
                        ease: EASE.enter,
                        onComplete: () => {
                            isAnimating = false;
                        },
                    }
                );
            },
        });
    }


    // -----------------------------
    // Sections positioning + transitions
    // -----------------------------
    function initSectionsPosition() {
        sections.forEach((sectionEl, i) => {
            gsap.set(sectionEl, { yPercent: i === 0 ? 0 : 100 });
        });
    }

    function goToSection(nextIndex, direction) {
        if (nextIndex < 0 || nextIndex >= sections.length) return;
        if (isAnimating) return;

        isAnimating = true;

        const current = sections[sectionIndex];
        const next = sections[nextIndex];

        const entryStep = getEntryStepIndex(next, direction);

        // убираем текущие outside сразу
        hideOutside();

        const tl = gsap.timeline({
            onComplete: () => {
                // Дорогу можно двигать в конце — не влияет на “паузы”
                // isAnimating отпустится внутри renderDeviceStep
            },
        });

        tl.to(current, {
            yPercent: direction > 0 ? -100 : 100,
            duration: DURATION.sectionSlide,
            ease: EASE.slide,
        })
            .fromTo(
                next,
                { yPercent: direction > 0 ? 100 : -100 },
                {
                    yPercent: 0,
                    duration: DURATION.sectionSlide,
                    ease: EASE.slide,
                },
                0
            )
            // Рендерим контент чуть раньше конца анимации секции — пауза пропадает
            .add(() => {
                sectionIndex = nextIndex;
                stepIndex = entryStep;

                renderDeviceStep(next, entryStep);
                showOutside(next, entryStep);
            }, DURATION.sectionSlide * 0.7);
    }

    // -----------------------------
    // Navigation (steps first, then sections)
    // -----------------------------
    function goForward() {
        if (isAnimating) return;

        const sectionEl = sections[sectionIndex];
        const steps = getStepTemplates(sectionEl);

        // next step in same section
        if (stepIndex < steps.length - 1) {
            stepIndex++;
            hideOutside();
            renderDeviceStep(sectionEl, stepIndex);
            showOutside(sectionEl, stepIndex);
            return;
        }

        // next section
        if (sectionIndex < sections.length - 1) {
            hideOutside();
            goToSection(sectionIndex + 1, +1);
        }
    }

    function goBackward() {
        if (isAnimating) return;

        const sectionEl = sections[sectionIndex];

        // previous step in same section
        if (stepIndex > 0) {
            stepIndex--;
            hideOutside();
            renderDeviceStep(sectionEl, stepIndex);
            showOutside(sectionEl, stepIndex);
            return;
        }

        // previous section
        if (sectionIndex > 0) {
            hideOutside();
            goToSection(sectionIndex - 1, -1);
        }
    }

    // -----------------------------
    // Init state
    // -----------------------------
    initSectionsPosition();

    renderDeviceStep(sections[0], 0);
    showOutside(sections[0], 0);

    // -----------------------------
    // Observer (wheel / touch / pointer)
    // -----------------------------
    const observer = Observer.create({
        type: "wheel,touch,pointer",
        preventDefault: true,
        tolerance: 10,
        wheelSpeed: -1,
        onDown: goForward,  // swipe down / wheel down -> forward
        onUp: goBackward,   // swipe up / wheel up -> backward
    });

    // -----------------------------
    // Keyboard
    // -----------------------------
    function onKeyDown(e) {
        if (e.key === "ArrowDown") goForward();
        if (e.key === "ArrowUp") goBackward();
    }

    window.addEventListener("keydown", onKeyDown);

    /**
     * Cleanup (optional usage):
     * const destroy = initObserver();
     * destroy();
     */
    return function destroy() {
        observer?.kill();
        window.removeEventListener("keydown", onKeyDown);
        hideOutside();
    };
}
