import { LinearGradient } from "expo-linear-gradient";
import { Activity, Heart, HeartPulse, Pill, Stethoscope, TestTube } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ theme, onFinish }) {
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;

    const fadeAnim     = useRef(new Animated.Value(0)).current;
    const scaleAnim    = useRef(new Animated.Value(0.25)).current;
    const pulseAnim    = useRef(new Animated.Value(1)).current;
    const ring1Scale   = useRef(new Animated.Value(1)).current;
    const ring1Opacity = useRef(new Animated.Value(0.8)).current;
    const ring2Scale   = useRef(new Animated.Value(1)).current;
    const ring2Opacity = useRef(new Animated.Value(0.5)).current;
    const textSlide    = useRef(new Animated.Value(50)).current;
    const textFade     = useRef(new Animated.Value(0)).current;
    const subtitleFade = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const footerFade   = useRef(new Animated.Value(0)).current;
    const p1 = useRef(new Animated.Value(0)).current;
    const p2 = useRef(new Animated.Value(0)).current;
    const p3 = useRef(new Animated.Value(0)).current;
    const p4 = useRef(new Animated.Value(0)).current;
    const p5 = useRef(new Animated.Value(0)).current;
    const p6 = useRef(new Animated.Value(0)).current;

    const isDark  = theme?.mode === "dark";
    const primary = theme?.primary || "#2dd4bf";

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 750, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        ]).start();

        Animated.loop(Animated.sequence([
            Animated.parallel([
                Animated.timing(ring1Scale,   { toValue: 1.9, duration: 1500, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                Animated.timing(ring1Opacity, { toValue: 0,   duration: 1500, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(ring1Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
                Animated.timing(ring1Opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            ]),
        ])).start();

        setTimeout(() => {
            Animated.loop(Animated.sequence([
                Animated.parallel([
                    Animated.timing(ring2Scale,   { toValue: 2.4, duration: 1900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                    Animated.timing(ring2Opacity, { toValue: 0,   duration: 1900, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(ring2Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(ring2Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
                ]),
            ])).start();
        }, 700);

        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.12, duration: 380, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(pulseAnim, { toValue: 1,    duration: 380, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
            Animated.delay(750),
        ])).start();

        setTimeout(() => {
            Animated.parallel([
                Animated.timing(textSlide, { toValue: 0, duration: 650, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
                Animated.timing(textFade,  { toValue: 1, duration: 650, useNativeDriver: true }),
            ]).start();
        }, 350);

        setTimeout(() => {
            Animated.timing(subtitleFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        }, 750);

        setTimeout(() => {
            Animated.timing(progressAnim, { toValue: 1, duration: 2400, useNativeDriver: false, easing: Easing.inOut(Easing.cubic) }).start();
        }, 200);

        setTimeout(() => {
            Animated.timing(footerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        }, 1000);

        [p1, p2, p3, p4, p5, p6].forEach((p, i) => {
            setTimeout(() => {
                Animated.loop(Animated.sequence([
                    Animated.timing(p, { toValue: 1,    duration: 1400 + i * 180, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(p, { toValue: 0.15, duration: 1400 + i * 180, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                ])).start();
            }, i * 180);
        });

        const timer = setTimeout(() => {
            if (typeof onFinishRef.current === "function") onFinishRef.current();
        }, 3200);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

    const bgColors = isDark
        ? ["#040d1a", "#071828", "#0a2035"]
        : ["#edfaf8", "#f4fbfa", "#ffffff"];

    const particles = [
        { Icon: HeartPulse,  color: isDark ? "rgba(45,212,191,0.38)"  : "rgba(13,148,136,0.28)",  size: 22, pos: { top: height * 0.13, left: width * 0.09 },  anim: p1 },
        { Icon: Pill,        color: isDark ? "rgba(99,179,237,0.35)"   : "rgba(59,130,246,0.24)",  size: 18, pos: { top: height * 0.19, right: width * 0.08 },  anim: p2 },
        { Icon: Stethoscope, color: isDark ? "rgba(167,243,208,0.32)"  : "rgba(16,185,129,0.22)",  size: 21, pos: { top: height * 0.68, left: width * 0.07 },   anim: p3 },
        { Icon: TestTube,    color: isDark ? "rgba(196,181,253,0.32)"  : "rgba(139,92,246,0.22)",  size: 17, pos: { top: height * 0.74, right: width * 0.09 },  anim: p4 },
        { Icon: Heart,       color: isDark ? "rgba(252,165,165,0.32)"  : "rgba(239,68,68,0.2)",    size: 16, pos: { top: height * 0.11, right: width * 0.22 },  anim: p5 },
        { Icon: Activity,    color: isDark ? "rgba(103,232,249,0.32)"  : "rgba(6,182,212,0.22)",   size: 20, pos: { bottom: height * 0.22, left: width * 0.2 }, anim: p6 },
    ];

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />

            <View style={[s.blob, { width: width * 0.85, height: width * 0.85, top: -width * 0.3, left: -width * 0.22, backgroundColor: isDark ? "rgba(45,212,191,0.055)" : "rgba(45,212,191,0.11)" }]} />
            <View style={[s.blob, { width: width * 0.68, height: width * 0.68, bottom: -width * 0.2, right: -width * 0.2, backgroundColor: isDark ? "rgba(59,130,246,0.055)" : "rgba(99,179,237,0.09)" }]} />
            <View style={[s.blob, { width: width * 0.42, height: width * 0.42, bottom: height * 0.28, left: -width * 0.14, backgroundColor: isDark ? "rgba(139,92,246,0.045)" : "rgba(139,92,246,0.07)" }]} />

            {particles.map(({ Icon, color, size, pos, anim }, i) => (
                <Animated.View key={i} style={[s.particle, pos, { opacity: anim }]}>
                    <Icon size={size} color={color} strokeWidth={1.5} />
                </Animated.View>
            ))}

            <View style={s.center}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: "center" }}>
                    <Animated.View style={[s.ring, { width: 162, height: 162, borderRadius: 81, borderColor: primary, opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]} />
                    <Animated.View style={[s.ring, { width: 162, height: 162, borderRadius: 81, borderColor: primary, opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]} />

                    <LinearGradient
                        colors={isDark ? ["#0d4e42", "#0e3a60", "#101c3a"] : ["#ccfbf1", "#bfdbfe", "#a7f3d0"]}
                        style={s.logoCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[s.logoInner, { borderColor: isDark ? "rgba(45,212,191,0.45)" : "rgba(13,148,136,0.35)", backgroundColor: isDark ? "rgba(8,18,38,0.68)" : "rgba(255,255,255,0.78)" }]}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <HeartPulse size={60} color={primary} strokeWidth={1.7} />
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <Animated.View style={{ opacity: textFade, transform: [{ translateY: textSlide }], alignItems: "center", marginTop: 34 }}>
                    <Text style={[s.appName, { color: theme?.text || "#0f172a" }]}>Suhaim Soft</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 }}>
                        <View style={[s.divLine, { backgroundColor: isDark ? "rgba(45,212,191,0.28)" : "rgba(13,148,136,0.22)" }]} />
                        <View style={[s.divDot, { backgroundColor: primary }]} />
                        <View style={[s.divLine, { backgroundColor: isDark ? "rgba(45,212,191,0.28)" : "rgba(13,148,136,0.22)" }]} />
                    </View>
                    <View style={[s.pill, { backgroundColor: isDark ? "rgba(45,212,191,0.1)" : "rgba(45,212,191,0.09)", borderColor: isDark ? "rgba(45,212,191,0.26)" : "rgba(45,212,191,0.3)", marginTop: 13 }]}>
                        <Text style={[s.pillText, { color: primary }]}>?  Smart Clinic Management System  ?</Text>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: subtitleFade, flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    {["Appointments", "Prescriptions", "Analytics"].map((tag) => (
                        <View key={tag} style={[s.tag, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)" }]}>
                            <Text style={[s.tagText, { color: theme?.textDim || "#64748b" }]}>{tag}</Text>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View style={{ opacity: subtitleFade, width: width * 0.62, marginTop: 52 }}>
                    <View style={[s.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }]}>
                        <Animated.View style={{ width: progressWidth, borderRadius: 99, overflow: "hidden" }}>
                            <LinearGradient colors={[primary, isDark ? "#3b82f6" : "#06b6d4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.progressFill} />
                        </Animated.View>
                    </View>
                    <Text style={[s.loadingLabel, { color: theme?.textDim || "#94a3b8" }]}>Initializing system…</Text>
                </Animated.View>
            </View>

            <Animated.View style={[s.footer, { opacity: footerFade }]}>
                <Text style={[s.footerText, { color: theme?.textDim || "#94a3b8" }]}>Powered by Suhaim Technologies</Text>
                <Text style={[s.versionText, { color: isDark ? "rgba(255,255,255,0.17)" : "rgba(0,0,0,0.15)" }]}>v 1.0.0</Text>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    center:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    blob:         { position: "absolute", borderRadius: 9999 },
    particle:     { position: "absolute" },
    ring:         { position: "absolute", borderWidth: 1.5 },
    logoCard:     { width: 160, height: 160, borderRadius: 50, alignItems: "center", justifyContent: "center", shadowColor: "#2dd4bf", shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.5, shadowRadius: 34, elevation: 26 },
    logoInner:    { width: 126, height: 126, borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    appName:      { fontSize: 38, fontWeight: "900", letterSpacing: 0.4 },
    divLine:      { width: 42, height: 1.5, borderRadius: 99 },
    divDot:       { width: 6, height: 6, borderRadius: 99 },
    pill:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
    pillText:     { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
    tag:          { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    tagText:      { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
    progressTrack:{ height: 5, borderRadius: 99, overflow: "hidden" },
    progressFill: { height: 5, borderRadius: 99 },
    loadingLabel: { fontSize: 11, fontWeight: "600", marginTop: 10, textAlign: "center", letterSpacing: 0.5 },
    footer:       { alignItems: "center", paddingBottom: 40 },
    footerText:   { fontSize: 12, fontWeight: "500", letterSpacing: 0.3 },
    versionText:  { fontSize: 11, marginTop: 4, fontWeight: "500", letterSpacing: 1.2 },
});
