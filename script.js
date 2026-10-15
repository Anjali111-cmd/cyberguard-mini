const STORAGE_KEY = "cyberguard_complaints";

function getComplaints() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveComplaints(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[character];
    });
}

function analyzeComplaint(text) {
    const complaint = text.toLowerCase();

    if (/upi|bank|banking|payment|money|transaction|debit|credit card|atm|financial fraud/.test(complaint)) {
        return { category: "UPI / Financial Fraud", priority: "High" };
    }
    if (/phishing|fake link|suspicious link|malicious link|otp|fake website|click.*link/.test(complaint)) {
        return { category: "Phishing", priority: "High" };
    }
    if (/hack|hacked|hacking|password stolen|unauthorized access|unauthorised access|account compromised/.test(complaint)) {
        return { category: "Account Hacking", priority: "High" };
    }
    if (/instagram|facebook|social media|whatsapp|telegram|snapchat|fake profile|fake account|impersonation/.test(complaint)) {
        return { category: "Social Media Fraud", priority: "Medium" };
    }

    return { category: "Other", priority: "Low" };
}

function generateComplaintID() {
    return "CG-" + Math.floor(100000 + Math.random() * 900000);
}

const complaintForm = document.getElementById("complaintForm");
const complaint = document.getElementById("complaint");
const charCount = document.getElementById("charCount");
const evidenceInput = document.getElementById("evidence");
const evidenceList = document.getElementById("evidenceList");
const screenshotInput = document.getElementById("screenshots");
const preview = document.getElementById("preview");

let selectedEvidence = [];
let selectedScreenshots = [];

if (complaint) {
    complaint.addEventListener("input", function() {
        charCount.textContent = complaint.value.length + " / 1000";
    });
}

if (evidenceInput) {
    evidenceInput.addEventListener("change", function() {
        selectedEvidence = Array.from(evidenceInput.files).slice(0, 5);
        evidenceList.innerHTML = "";
        selectedEvidence.forEach(function(file) {
            const div = document.createElement("div");
            div.textContent = "📎 " + file.name;
            evidenceList.appendChild(div);
        });
    });
}

if (screenshotInput) {
    screenshotInput.addEventListener("change", function() {
        selectedScreenshots = Array.from(screenshotInput.files)
            .filter(file => file.type.startsWith("image/"))
            .slice(0, 3);

        preview.innerHTML = "";

        selectedScreenshots.forEach(function(file) {
            if (file.size > 1024 * 1024) {
                const error = document.createElement("p");
                error.className = "error";
                error.textContent = file.name + " is larger than 1 MB.";
                preview.appendChild(error);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const image = document.createElement("img");
                image.src = event.target.result;
                image.alt = "Screenshot preview";
                preview.appendChild(image);
            };
            reader.readAsDataURL(file);
        });
    });
}

if (complaintForm) {
    complaintForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const text = complaint.value.trim();
        if (!text) {
            alert("Please enter your complaint.");
            return;
        }

        const analysis = analyzeComplaint(text);
        let complaintID = generateComplaintID();
        const complaints = getComplaints();

        while (complaints.some(item => item.id === complaintID)) {
            complaintID = generateComplaintID();
        }

        const currentDate = new Date().toLocaleString();

        const complaintData = {
            id: complaintID,
            text: text,
            category: analysis.category,
            priority: analysis.priority,
            status: "Registered",
            date: currentDate,
            updatedAt: currentDate,
            evidence: selectedEvidence.map(file => file.name),
            screenshots: selectedScreenshots.map(file => file.name)
        };

        complaints.unshift(complaintData);

        try {
            saveComplaints(complaints);
            fetch('/api/complaints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(complaintData)
            }).catch(e => console.log('Backend sync bypassed'));
        } catch (error) {
            alert("Could not save the complaint. Please reduce screenshot size.");
            return;
        }

        const result = document.getElementById("submissionResult");
        result.classList.remove("hidden");
        result.classList.add("success");
        result.innerHTML = `
            <h3>✅ Complaint Registered Successfully</h3>
            <p><b>Complaint ID:</b> ${escapeHTML(complaintID)}</p>
            <p><b>Category:</b> ${escapeHTML(analysis.category)}</p>
            <p><b>Priority:</b> ${escapeHTML(analysis.priority)}</p>
            <p>Save this Complaint ID for tracking.</p>
        `;

        complaintForm.reset();
        selectedEvidence = [];
        selectedScreenshots = [];
        evidenceList.innerHTML = "";
        preview.innerHTML = "";
        charCount.textContent = "0 / 1000";

        result.scrollIntoView({ behavior: "smooth", block: "center" });
    });
}

const trackBtn = document.getElementById("trackBtn");
if (trackBtn) {
    trackBtn.addEventListener("click", trackComplaint);
}

function trackComplaint() {
    const input = document.getElementById("trackId");
    const result = document.getElementById("trackResult");
    const id = input.value.trim().toUpperCase();

    result.classList.remove("hidden");
    const complaints = getComplaints();
    const complaint = complaints.find(item => item.id.toUpperCase() === id);

    if (!complaint) {
        result.classList.remove("success");
        result.innerHTML = `
            <h3>❌ Complaint Not Found</h3>
            <p>Please check your Complaint ID.</p>
        `;
        return;
    }

    result.classList.add("success");
    result.innerHTML = `
        <h3>Complaint ${escapeHTML(complaint.id)}</h3>
        <p><b>Category:</b> ${escapeHTML(complaint.category)}</p>
        <p><b>Priority:</b> ${escapeHTML(complaint.priority)}</p>
        <p><b>Status:</b> ${escapeHTML(complaint.status)}</p>
        <p><b>Registered:</b> ${escapeHTML(complaint.date)}</p>
        <p><b>Last Updated:</b> ${escapeHTML(complaint.updatedAt)}</p>
    `;
}

const trackInput = document.getElementById("trackId");
if (trackInput) {
    trackInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            trackComplaint();
        }
    });
}

const voiceBtn = document.getElementById("voiceBtn");
const voiceControls = document.getElementById("voiceControls");
if (voiceBtn) {
    voiceBtn.addEventListener("click", function() {
        voiceControls.classList.toggle("hidden");
    });
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = function() {
        document.getElementById("voiceStatus").textContent = "Listening...";
    };

    recognition.onend = function() {
        document.getElementById("voiceStatus").textContent = "Voice ready";
    };

    recognition.onerror = function() {
        document.getElementById("voiceStatus").textContent = "Voice error";
    };

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript;
        complaint.value = (complaint.value + " " + spokenText).trim().slice(0, 1000);
        complaint.dispatchEvent(new Event("input"));
    };
}

const startVoice = document.getElementById("startVoice");
if (startVoice) {
    startVoice.addEventListener("click", function() {
        if (!recognition) {
            alert("Voice input is not supported. Please use Google Chrome.");
            return;
        }
        try { recognition.start(); } catch (error) { console.log(error); }
    });
}

const stopVoice = document.getElementById("stopVoice");
if (stopVoice) {
    stopVoice.addEventListener("click", function() {
        if (recognition) { recognition.stop(); }
    });
}

const readVoice = document.getElementById("readVoice");
if (readVoice) {
    readVoice.addEventListener("click", function() {
        if (!complaint.value.trim()) {
            alert("Enter complaint text first.");
            return;
        }
        speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(complaint.value);
        speechSynthesis.speak(speech);
    });
}