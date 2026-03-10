'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F5F5DC] text-[#3E2C22] flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
          מדיניות פרטיות - Barista Mate
        </h1>
        <div className="space-y-6 text-lg">
          <p>
            אנו ב-Barista Mate מעריכים את פרטיותך ומחויבים להגן עליה. מדיניות זו מתארת איזה מידע אנו אוספים וכיצד אנו משתמשים בו.
          </p>
          
          <section>
            <h2 className="text-2xl font-semibold mb-2 text-[#C67C4E]">איסוף מידע</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>פרטי חשבון:</strong> בעת התחברות באמצעות Google, אנו שומרים את כתובת הדוא"ל והשם שלך. מידע זה משמש אך ורק לסנכרון הנתונים שלך בין מכשירים שונים.
              </li>
              <li>
                <strong>נתוני שימוש:</strong> אנו שומרים את המידע שאתה מזין באפליקציה, כגון פולי קפה ויומן תחזוקה. נתונים אלה נשמרים באופן מאובטח ב-Firebase ומשויכים לחשבונך.
              </li>
              <li>
                <strong>מצב אורח:</strong> אם תבחר "המשך כאורח", כל הנתונים שתזין יישמרו באופן מקומי על המכשיר שלך בלבד. עם ביצוע התנתקות, נתונים אלו יימחקו לצמיתות.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-[#C67C4E]">שימוש במידע</h2>
            <p>
              המידע הנאסף משמש אך ורק לתפעול האפליקציה ולשיפור חווית המשתמש שלך. אנו לא חולקים את המידע שלך עם צדדים שלישיים, ולא משתמשים בו למטרות פרסום או שיווק.
            </p>
          </section>

          <div className="text-center mt-10">
            <Link href="/" className="text-[#C67C4E] hover:underline text-xl">
              חזרה לעמוד הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
