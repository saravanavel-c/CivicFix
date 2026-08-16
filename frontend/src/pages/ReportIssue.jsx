import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { PriorityBadge } from '../components/common/PriorityBadge';

// Sample high-quality mock images of civic issues for easy simulation click
const PRESET_MOCK_IMAGES = [
  {
    label: "Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80"
  },
  {
    label: "Garbage Overflow",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80"
  },
  {
    label: "Broken Light",
    url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&auto=format&fit=crop&q=80"
  }
];

export const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AI Suggestion');
  const [priority, setPriority] = useState('Medium');
  
  // Interaction states
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  // Voice recording mock simulation
  const handleVoiceInput = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
    } else {
      setIsListeningVoice(true);
      // Simulate listening and typing after 2 seconds
      setTimeout(() => {
        setDescription((prev) => 
          prev ? prev + " The drainage cover is loose and water is leaking." : "Heavy garbage piled up on the street corners emitting bad odor."
        );
        setIsListeningVoice(false);
      }, 2500);
    }
  };

  // Geolocation mock simulation
  const handleGetLocation = () => {
    setIsCapturingLocation(true);
    setTimeout(() => {
      setCoordinates({ lat: '11.0168', lng: '76.9558' });
      setLocationName('Gandhipuram Cross St, Coimbatore, Tamil Nadu');
      setIsCapturingLocation(false);
    }, 1200);
  };

  // Image Upload handlers
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(URL.createObjectURL(file));
      setFormErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const handlePresetSelect = (url) => {
    setImage(url);
    setFormErrors((prev) => ({ ...prev, image: null }));
  };

  // Step Validation
  const validateStep = () => {
    const errors = {};
    if (step === 1 && !image) {
      errors.image = "Please snap/upload a photo or choose a simulation preset.";
    }
    if (step === 2 && !locationName) {
      errors.location = "Please enter a location or retrieve your coordinates.";
    }
    if (step === 3 && !description.trim()) {
      errors.description = "Please describe the issue to guide repairs.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Map AI Suggestion to a calculated category or just 'Other'
      const finalCategory = category === 'AI Suggestion' ? 'Road' : category;
      
      const newReport = await complaintService.createComplaint({
        category: finalCategory,
        description,
        location: locationName,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        image,
        priority: priority
      });
      setCreatedId(newReport.id);
      setStep(6); // Confirmation screen
    } catch (err) {
      console.error("Failed to submit complaint:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setImage(null);
    setLocationName('');
    setCoordinates({ lat: '', lng: '' });
    setDescription('');
    setCategory('AI Suggestion');
    setPriority('Medium');
    setCreatedId(null);
    setFormErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header and Step Indicator */}
      {step <= 5 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => step > 1 ? handleBack() : navigate('/dashboard')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-display">Report an Issue</h1>
              <p className="text-xs text-slate-400">Step {step} of 5 — {
                step === 1 ? 'Capture Photo' :
                step === 2 ? 'Set Location' :
                step === 3 ? 'Describe Issue' :
                step === 4 ? 'Categorize' : 'Final Review'
              }</p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-primary-600' : 'bg-slate-200'
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: CAPTURE/UPLOAD IMAGE */}
      {step === 1 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-800">Upload or Capture a Photo</h3>
            <p className="text-xs text-slate-400">Include a clear image of the issue to speed up assessment.</p>
          </div>

          {/* Image Upload Area */}
          <div className="relative border-2 border-dashed border-slate-200 hover:border-primary-500 rounded-2xl flex flex-col items-center justify-center min-h-[220px] transition-all bg-slate-50/50 overflow-hidden group">
            {image ? (
              <div className="w-full h-[220px] relative">
                <img src={image} alt="Uploaded issue preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold backdrop-blur-sm cursor-pointer"
                >
                  Clear Photo
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 p-6 w-full h-full cursor-pointer select-none">
                <div className="p-3 bg-white shadow-sm border border-slate-100 text-slate-500 rounded-xl group-hover:scale-105 transition-transform duration-200">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Take Photo or Upload</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click to browse your device camera/gallery</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {formErrors.image && (
            <p className="text-xs text-rose-500 text-center font-medium">{formErrors.image}</p>
          )}

          {/* Presets simulation helper */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulation Presets (Click to Auto-fill)</p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_MOCK_IMAGES.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url)}
                  className={`border rounded-xl p-2 flex flex-col items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-all select-none cursor-pointer ${
                    image === preset.url ? 'border-primary-500 ring-2 ring-primary-500/10 bg-primary-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="w-full h-12 rounded-lg bg-slate-200 overflow-hidden">
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button onClick={handleNext} variant="primary" size="md">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: LOCATION */}
      {step === 2 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-800">Identify the Location</h3>
            <p className="text-xs text-slate-400">Pinpoint where the problem is located.</p>
          </div>

          <FormInput 
            label="Street Address / Landmarks"
            name="locationName"
            placeholder="e.g. Cross Cut Road, opposite GP Bus Stop"
            value={locationName}
            onChange={(e) => {
              setLocationName(e.target.value);
              setFormErrors((prev) => ({ ...prev, location: null }));
            }}
            error={formErrors.location}
            required
          />

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="text-xs font-semibold text-slate-700">GPS Coordinates</p>
              <p className="text-xs text-slate-400 font-mono">
                {coordinates.lat && coordinates.lng 
                  ? `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}` 
                  : 'No coordinates set yet'
                }
              </p>
            </div>
            <Button 
              onClick={handleGetLocation} 
              isLoading={isCapturingLocation}
              variant="outline" 
              size="sm"
              icon={MapPin}
            >
              Use My Current Location
            </Button>
          </div>

          {/* Map Placeholder */}
          <div className="w-full h-44 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {/* Styled mockup of map lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0369a1_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute h-0.5 bg-sky-200 w-full top-1/2"></div>
            <div className="absolute w-0.5 bg-sky-200 h-full left-1/3"></div>
            
            <div className="relative p-3 bg-white rounded-full shadow-lg border border-slate-100 text-primary-600 animate-bounce">
              <MapPin className="h-6 w-6 fill-primary-200" />
            </div>
            <p className="text-xs font-semibold text-primary-700 mt-3 relative">
              {locationName ? locationName : "Drag pin to adjust"}
            </p>
            <p className="text-[10px] text-primary-400 relative mt-0.5">Mock Geolocation Preview Enabled</p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" size="md">
              Back
            </Button>
            <Button onClick={handleNext} variant="primary" size="md">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: DESCRIPTION */}
      {step === 3 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-800">Describe the Issue</h3>
            <p className="text-xs text-slate-400">Add key details that explain the size or hazard level of the issue.</p>
          </div>

          <div className="space-y-2">
            <FormInput 
              label="Issue Details"
              name="description"
              type="textarea"
              placeholder="e.g. Large pothole in the left lane, about 10 inches deep. Vehicles are swerving to avoid it, causing near misses."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFormErrors((prev) => ({ ...prev, description: null }));
              }}
              error={formErrors.description}
              rows={5}
              required
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={handleVoiceInput}
                variant={isListeningVoice ? 'danger' : 'outline'}
                size="sm"
                icon={isListeningVoice ? MicOff : Mic}
                className={isListeningVoice ? 'animate-pulse' : ''}
              >
                {isListeningVoice ? 'Listening...' : 'Voice Dictate'}
              </Button>
            </div>
            {isListeningVoice && (
              <div className="flex items-center justify-center gap-1 py-2 bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs font-semibold text-rose-500 ml-2">Simulating speech text input...</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" size="md">
              Back
            </Button>
            <Button onClick={handleNext} variant="primary" size="md">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: CATEGORIZATION */}
      {step === 4 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-800">Select Category</h3>
            <p className="text-xs text-slate-400">Select the issue category or let our AI auto-detect it for you.</p>
          </div>

          {/* AI Suggestion Banner */}
          <div 
            onClick={() => setCategory('AI Suggestion')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
              category === 'AI Suggestion'
                ? 'border-violet-500 bg-violet-50/50 shadow-sm shadow-violet-500/5'
                : 'border-slate-200 bg-white hover:border-violet-300'
            }`}
          >
            <div className={`p-3.5 rounded-xl shrink-0 ${
              category === 'AI Suggestion' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">AI Auto-Detect Category</h4>
                <span className="text-[9px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Default
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our model will analyze your photo and description post-submission to tag and assign it to the authority automatically.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or Specify Category Manually</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Road', 'Sanitation', 'Drainage', 'Water', 'Electricity', 'Other'].map((catName) => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setCategory(catName)}
                  className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 font-medium transition-all duration-200 cursor-pointer ${
                    category === catName 
                      ? 'border-primary-500 ring-2 ring-primary-500/10 bg-primary-50/30 text-primary-700 font-bold' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-sm">{catName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority selection for review step */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specify Severity Level</p>
            <div className="flex gap-4">
              {['Low', 'Medium', 'High'].map((prio) => (
                <label key={prio} className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all">
                  <input 
                    type="radio" 
                    name="priority" 
                    value={prio} 
                    checked={priority === prio} 
                    onChange={() => setPriority(prio)}
                    className="accent-primary-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">{prio}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" size="md">
              Back
            </Button>
            <Button onClick={handleNext} variant="primary" size="md">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW */}
      {step === 5 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-800">Review & Submit</h3>
            <p className="text-xs text-slate-400">Confirm all details before lodging the official complaint.</p>
          </div>

          {/* Card Review Wrapper */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {/* Image Preview Header */}
            {image && (
              <div className="w-full h-44 relative bg-slate-100">
                <img src={image} alt="Report preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-slate-900/60 text-white rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
                  <Eye size={14} />
                  Photo Attached
                </div>
              </div>
            )}

            {/* details text */}
            <div className="p-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Category</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                    {category === 'AI Suggestion' ? (
                      <>
                        <Sparkles size={12} className="text-violet-500 animate-pulse" />
                        AI Auto (Pothole/Road)
                      </>
                    ) : category}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity Priority</p>
                  <div className="mt-0.5">
                    <PriorityBadge priority={priority} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complaint Location</p>
                <p className="text-xs font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  {locationName}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description Details</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {description}
                </p>
              </div>
            </div>

            {/* AI suggest metrics */}
            <div className="p-4 bg-violet-50/30 flex items-start gap-3">
              <Sparkles className="text-violet-600 shrink-0 h-4.5 w-4.5 stroke-[2] mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-violet-800">Mock AI Analyzer suggestion</p>
                <p className="text-[10px] text-violet-500 leading-relaxed">
                  Based on similarity models, this issue matches 94% confidence for standard maintenance works. No duplicate reports found nearby.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button onClick={handleBack} variant="outline" size="md">
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              variant="success" 
              size="md"
              icon={Check}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRMATION/SUCCESS */}
      {step === 6 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6 text-center animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full animate-scale-up">
              <CheckCircle className="h-12 w-12 stroke-[1.8] fill-emerald-50" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-display mt-5">Complaint Submitted Successfully!</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              We have generated your ticket ID and queued it for the respective municipal authority.
            </p>
          </div>

          {/* Ticket ID display */}
          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 inline-block mx-auto min-w-[240px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LODGED ID</p>
            <h3 className="text-2xl font-bold font-display text-primary-600 mt-1">{createdId || 'CIV-1042'}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Use this ID to track updates in notifications</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-150 justify-center max-w-md mx-auto">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="secondary"
              fullWidth
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => navigate(`/complaints/${createdId || 'CIV-1024'}`)} 
              variant="primary"
              fullWidth
            >
              Track Complaint Status
            </Button>
          </div>

          <button
            onClick={resetForm}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors pt-2 block mx-auto underline cursor-pointer"
          >
            File Another Issue
          </button>
        </div>
      )}
    </div>
  );
};
export default ReportIssue;
