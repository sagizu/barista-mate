import { ImageResponse } from 'next/og';

export const alt = 'Barista Mate — העוזר האישי לבריסטה הביתי';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at top, #2a1d18 0%, #1a110e 55%, #0f0a08 100%)',
          color: '#EAE0D5',
          fontFamily: 'sans-serif',
          padding: '60px',
          border: '12px solid #3E2C22',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '112px',
            height: '112px',
            borderRadius: '28px',
            background: 'rgba(198, 124, 78, 0.16)',
            border: '2px solid rgba(198, 124, 78, 0.5)',
            marginBottom: '28px',
            fontSize: '56px',
          }}
        >
          ☕
        </div>

        <div
          style={{
            fontSize: '74px',
            fontWeight: 800,
            color: '#E6D2B5',
            letterSpacing: '-1.5px',
            marginBottom: '16px',
          }}
        >
          Barista Mate
        </div>

        <div
          style={{
            fontSize: '30px',
            color: '#C67C4E',
            fontWeight: 600,
            marginBottom: '44px',
          }}
        >
          Home Espresso Companion
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
          }}
        >
          {['Smart Dial-In', 'Bean Library', 'Machine Care'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 28px',
                borderRadius: '9999px',
                background: '#1F1712',
                border: '1px solid #3E2C22',
                color: '#E6D2B5',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
