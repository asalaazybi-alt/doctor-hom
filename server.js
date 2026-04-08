
import express from "express";
import cors from "cors";
import "dotenv/config";
import fetch from "node-fetch";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(process.cwd(), "public")));

const PORT = process.env.PORT || 3000;

app.post("/analyze", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: "لم يتم إرسال صورة" });

    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ success: false, error: "صيغة الصورة غير صحيحة" });

    const mimeType = matches[1];
    const base64Data = matches[2];

    // الرابط المحدث بناءً على لقطة الشاشة لحسابك (موديل 2.5 فلاش)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "أنت خبير في تحليل الجلد، حلل هذه الصورة بدقة واذكر ملاحظاتك باللغة العربية." },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔥 Google API Error:", data);
      return res.status(response.status).json({ success: false, error: data.error?.message || "خطأ من جوجل" });
    }

    // استخراج النص مع حماية ضد الـ undefined
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "لم يتم استلام تحليل من الموديل";
    
    // إرسال كائن JSON يحتوي على مفتاح 'result'
    res.json({ success: true, result: resultText });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    res.status(500).json({ success: false, error: "حدث خطأ في السيرفر" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
});