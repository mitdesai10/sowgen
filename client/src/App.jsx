import React, { useState } from 'react';
import ProgressBar from './components/ProgressBar';
import Step1Input from './components/Step1Input';
import Step2Loading from './components/Step2Loading';
import VerificationCard from './components/VerificationCard';
import Step3Preview from './components/Step3Preview';

export default function App() {
  const [step, setStep] = useState(1);
  const [sowData, setSowData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState(null);

  function handleSowGenerated(sow, formData) {
    setSowData(sow);
    setVerificationData(sow.verification || null);
    setFormSnapshot(formData);
    setStep(3);
    setShowVerification(true);
  }

  function handleGenerating() {
    setStep(2);
  }

  // On failure: go back to step 1 — Step1Input stays mounted so data is preserved
  function handleGenerationFailed() {
    setStep(1);
  }

  function handleVerificationConfirm() {
    setShowVerification(false);
  }

  function handleVerificationBack() {
    setShowVerification(false);
    setSowData(null);
    setVerificationData(null);
    setStep(1);
  }

  function handleRegenerate() {
    setSowData(null);
    setVerificationData(null);
    setShowVerification(false);
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-navy-50">
      {/* Header */}
      <header className="bg-navy-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-navy-800 font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SOWGen</h1>
              <p className="text-navy-100 text-xs">Statement of Work Generator</p>
            </div>
          </div>
          <div className="text-xs text-navy-200">Powered by Claude AI</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <ProgressBar step={step} />
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">

        {/* Step 2 loading */}
        {step === 2 && <Step2Loading />}

        {/* Verification card */}
        {step === 3 && showVerification && verificationData && (
          <VerificationCard
            verification={verificationData}
            onConfirm={handleVerificationConfirm}
            onBack={handleVerificationBack}
          />
        )}

        {/* Step 3 preview — shown after verification confirmed */}
        {step === 3 && !showVerification && sowData && (
          <Step3Preview
            sow={sowData}
            clientName={formSnapshot?.clientName || ''}
            companyName={formSnapshot?.companyName || ''}
            onRegenerate={handleRegenerate}
          />
        )}

        {/*
          Step 1 — always mounted so user input is never lost.
          Hidden via CSS when not active (step 2, step 3, or verification shown).
        */}
        <div className={step === 1 ? 'block' : 'hidden'}>
          <Step1Input
            onGenerating={handleGenerating}
            onSowGenerated={handleSowGenerated}
            onGenerationFailed={handleGenerationFailed}
          />
        </div>

      </main>
    </div>
  );
}
