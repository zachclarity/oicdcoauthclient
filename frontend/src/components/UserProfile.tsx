import { useAuth } from 'react-oidc-context';
import { useUserGroups, useIsAdmin } from '../hooks/useApi';
import { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  name: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: '0',
  },
  email: {
    color: '#666',
    margin: '4px 0 0 0',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
    marginTop: '8px',
  },
  adminBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  groupBadge: {
    backgroundColor: '#2196F3',
    color: 'white',
  },
  section: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  },
  tokenInfo: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
};

export function UserProfile() {
  const auth = useAuth();
  const groups = useUserGroups();
  const isAdmin = useIsAdmin();

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  const profile = auth.user.profile;
  const initials = (profile.name || profile.preferred_username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>{initials}</div>
        <div>
          <h2 style={styles.name}>{profile.name || profile.preferred_username}</h2>
          <p style={styles.email}>{profile.email}</p>
        </div>
      </div>

      <div>
        {isAdmin && (
          <span style={{ ...styles.badge, ...styles.adminBadge }}>
            ✓ ADMIN
          </span>
        )}
        {groups.map((group, index) => (
          <span key={index} style={{ ...styles.badge, ...styles.groupBadge }}>
            {group.replace(/^\//, '')}
          </span>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>User Details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#666' }}>Subject (sub)</td>
              <td style={{ padding: '8px 0' }}>{profile.sub}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#666' }}>Username</td>
              <td style={{ padding: '8px 0' }}>{profile.preferred_username}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#666' }}>Email Verified</td>
              <td style={{ padding: '8px 0' }}>
                {profile.email_verified ? '✓ Yes' : '✗ No'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Token Info</div>
        <div style={styles.tokenInfo}>
          <div><strong>Expires:</strong> {new Date(auth.user.expires_at! * 1000).toLocaleString()}</div>
          <div style={{ marginTop: '8px' }}>
            <strong>Token Type:</strong> {auth.user.token_type}
          </div>
        </div>
      </div>
    </div>
  );
}
