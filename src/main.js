import "./main.css";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger)

const inside = [
    "#user-pin",
    "#dialog-2",
    "#dialog-3",
    "#dialog-4",
    "#dialog-5",
    "#dialog-6",
];

const tlHero = gsap.timeline({
    scrollTrigger: {
        trigger: "#hero-title",
        start: "top 80%",
        onEnter: () => tlHero.restart(),
        onEnterBack: () => tlHero.restart(),
    },
});

tlHero.from(["#hero-1", "#hero-2", "#hero-3"], {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.2,
    ease: "power2.out",
});


const tlDialog = gsap.timeline({
    scrollTrigger: {
        trigger: "#dialog-1",
        start: "top 80%",
        onEnter: () => tlDialog.restart(),
        onEnterBack: () => tlDialog.restart(),
    },
});

// иконки слева → вправо
tlDialog.from(
    ["#event-1", "#event-2", "#event-3", "#event-4"],
    {
        opacity: 0,
        x: -20,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.12,
    }
)

    // текст снизу → вверх
    .from(
        "#text-1",
        {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: "power2.out",
        },
        "-=0.1" // слегка накладываем
    );


const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#scene",
        start: "top top+=100",
        end: "+=3000",
        scrub: true,
        pin: true,
        pinSpacing: true,
    },
})

tl.set(inside, {display: "none"})
tl.to("#iphone", {
    scale: 2,
    transformOrigin: "center",
    opacity: 0,
    zIndex: 0,
    top: 0,
    ease: "none",
}, 0)

tl.to("#map-1", {
    scale: 1.2,
    transformOrigin: "center",
    ease: "none",
}, 0)

// tl.to('#dialog-1', {
//     opacity: 0,
// }, 0)

// move map
tl.to("#map-1", {
    y: '-25%',
    ease: "none",
}, ">")

// animate 1st scene
tl.set('#user-pin, #dialog-2', {display: 'block'}, '>')
tl.set('#dialog-3', {display: 'flex'}, '<')
tl.from("#user-pin, #dialog-2", {
    scale: 0,
    opacity: 0,
    stagger: 0.5,
}, "<")
tl.from("#user-pic-1,#user-pic-2,#user-pic-3,#user-pic-4,#user-pic-5", {
    scale: 0,
    opacity: 0,
    stagger: 0.12,
}, ">")
tl.from("#dialog-3", {
    y: 20,
    opacity: 0,
    stagger: 0.5,
}, "<")
tl.to('#user-pin, #dialog-2, #dialog-3', {
    opacity: 0,
}, '>')

// move map
tl.to("#map-1", {
    y: '-30%',
    ease: "none",
}, ">")


// анимация 2-го диалога
tl.set('#user-pin,#dialog-2,#dialog-3', {display: 'none'}, '>')
tl.set("#dialog-4", {display: "block"}, '<')
tl.set("#dialog-5", {display: "flex"}, '<')
tl.from("#dialog-4", {
    opacity: 0,
    scale: 0
}, "<")
tl.from("#dialog-button-1", {
    opacity: 0,
    scale: 0
}, ">")
tl.from("#dialog-5", {
    opacity: 0,
    y: 100,
    scale: 0
}, ">")


// tl.set("#dialog-4,#dialog-5", {display: "none"}, '>')
tl.to("#iphone", {
    scale: 1,
    transformOrigin: "center",
    opacity: 1,
    zIndex: 2,
}, ">")
tl.to("#map-1", {
    scale: 1,
}, "<")
tl.to('#iphone-content', {
    scale: 0.7,
},'<')

// tl.to("#dialog-4", {
//     scale: 0.7,
//     transformOrigin: "top center",
// }, "<")
//
// tl.to("#dialog-5", {
//     scale: 0.6,
//     top: 280,
// }, '<')

tl.from("#dialog-6", {
    opacity: 0,
    y: 100,
}, '>')
