import React from 'react';
import CADS from '../../components/cads/CADS';
import '../../components/cads/cads.css';

const CADSPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0b0d 0%, #1a1d23 100%)',
      color: '#ffffff',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <CADS />
    </div>
  );
};

export default CADSPage;
