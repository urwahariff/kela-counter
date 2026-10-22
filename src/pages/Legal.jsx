import { Link } from 'react-router-dom';
import { TopBar, useTitle } from '../components/ui.jsx';

const CONTACT = 'urwaharif9@gmail.com';
const UPDATED = '22 October 2026';

function Page({ title, children }) {
  return (
    <div className="screen">
      <TopBar back="/" />
      <div className="content body" style={{ gap: 12, lineHeight: 1.6 }}>
        <h1 className="h1">{title}</h1>
        <div className="tiny quiet">Last updated {UPDATED}</div>
        {children}
        <div className="row gap14 small" style={{ marginTop: 12 }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/">Home</Link>
        </div>
      </div>
    </div>
  );
}

const H = ({ children }) => <h2 className="h2" style={{ fontSize: 18, marginTop: 8 }}>{children}</h2>;

export function Privacy() {
  useTitle('Privacy');
  return (
    <Page title="Privacy">
      <p>Kela Counter is a game for friend groups. This page explains what it stores and who can see it.</p>
      <H>What we collect</H>
      <ul>
        <li><b>From Google sign-in:</b> your name and email address, used only to create and sign in to your account.</li>
        <li><b>Your profile:</b> the display name, colour and icon you choose, and a photo only if you upload one.</li>
        <li><b>Game activity:</b> the realms you create or join, kela reports, confirmations and scores.</li>
      </ul>
      <H>Who can see it</H>
      <ul>
        <li>Your profile and scores are visible only to people in the same realms as you.</li>
        <li>Realms are private. Someone needs the invite link or code to see a realm's name and members.</li>
        <li>Who reported a kela is stored to prevent spam but is never shown to anyone.</li>
        <li>Share cards are only shared when you choose to save or share them.</li>
      </ul>
      <H>What we don't do</H>
      <p>No ads, no tracking, and we never sell or share your data with anyone.</p>
      <H>Where it's stored</H>
      <p>Data is stored with Supabase (database and photo storage) and the site is hosted on Vercel.</p>
      <H>Deleting your data</H>
      <p>You can remove your photo anytime from your profile, and leave any realm from its settings. To delete your account and everything linked to it, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
      <H>Contact</H>
      <p>Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Page>
  );
}

export function Terms() {
  useTitle('Terms');
  return (
    <Page title="Terms">
      <p>By using Kela Counter you agree to these simple rules.</p>
      <H>Keep it fun</H>
      <ul>
        <li>Kela Counter is for friendly roasting. Roast the kela, never the person.</li>
        <li>Don't use it to bully, harass or embarrass anyone. Don't upload photos of other people without their permission.</li>
        <li>Anyone can leave a realm at any time.</li>
      </ul>
      <H>Realms and admins</H>
      <p>Realm admins can delete reports and remove members. We may remove content or accounts that break these rules.</p>
      <H>No guarantees</H>
      <p>Kela Counter is a free hobby project provided as is. It may change, pause or shut down, and scores may be reset.</p>
      <H>Contact</H>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Page>
  );
}
