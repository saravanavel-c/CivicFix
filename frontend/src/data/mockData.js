// CivicFix Citizen Dashboard - Mock Data

export const mockUser = {
  name: "Saravana Vel",
  email: "saravana.vel@civicfix.gov.in",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  preferredLanguage: "English",
  savedLocation: "Gandhipuram, Coimbatore, Tamil Nadu",
  joinedDate: "October 2025"
};

export const mockStats = {
  total: 12,
  pending: 2,
  inProgress: 3,
  resolved: 7
};

export const mockNotifications = [
  {
    id: "notif-1",
    complaintId: "CIV-1024",
    title: "Complaint Acknowledged",
    message: "Your complaint CIV-1024 (Pothole near Bus Stop) has been acknowledged.",
    type: "info",
    timestamp: "2 hours ago",
    read: false
  },
  {
    id: "notif-2",
    complaintId: "CIV-1024",
    title: "Authority Assigned",
    message: "Complaint CIV-1024 has been assigned to the Road Maintenance Department.",
    type: "info",
    timestamp: "1 day ago",
    read: false
  },
  {
    id: "notif-3",
    complaintId: "CIV-1007",
    title: "Complaint Resolved 🎉",
    message: "Your complaint CIV-1007 (Streetlight Broken) has been resolved. Please review and provide feedback.",
    type: "success",
    timestamp: "3 days ago",
    read: true
  },
  {
    id: "notif-4",
    complaintId: "CIV-1011",
    title: "Work In Progress",
    message: "Repair works have commenced for your complaint CIV-1011 (Drainage blockage).",
    type: "progress",
    timestamp: "4 days ago",
    read: true
  },
  {
    id: "notif-5",
    complaintId: "CIV-1015",
    title: "Complaint Rejected",
    message: "Your report CIV-1015 has been rejected: 'Duplicate report. A team is already assigned.'",
    type: "error",
    timestamp: "1 week ago",
    read: true
  }
];

export const mockNearbyIssues = [
  {
    id: "near-1",
    category: "Road",
    title: "Deep Pothole at Corner",
    description: "Dangerous pothole right at the intersection causing vehicles to swerve.",
    location: "Gandhipuram 3rd Street (120m away)",
    citizensAffected: 12,
    upvotes: 8,
    userUpvoted: false,
    coordinates: { x: 35, y: 40 },
    status: "Acknowledged"
  },
  {
    id: "near-2",
    category: "Sanitation",
    title: "Overflowing Dustbin",
    description: "Garbage bin hasn't been cleared for three days. Dogs spreading trash.",
    location: "Cross Cut Road (350m away)",
    citizensAffected: 24,
    upvotes: 18,
    userUpvoted: true,
    coordinates: { x: 60, y: 25 },
    status: "In Progress"
  },
  {
    id: "near-3",
    category: "Water",
    title: "Water Main Leakage",
    description: "Clean drinking water leaking continuously from the main pipe under the walkway.",
    location: "Sathy Road (500m away)",
    citizensAffected: 45,
    upvotes: 32,
    userUpvoted: false,
    coordinates: { x: 20, y: 70 },
    status: "Submitted"
  },
  {
    id: "near-4",
    category: "Drainage",
    title: "Open Manhole Drain",
    description: "Drain cover is broken and left open. Highly hazardous for pedestrians at night.",
    location: "NPR Layout (180m away)",
    citizensAffected: 9,
    upvotes: 14,
    userUpvoted: false,
    coordinates: { x: 75, y: 65 },
    status: "Assigned"
  },
  {
    id: "near-5",
    category: "Electricity",
    title: "Flickering Streetlight",
    description: "Streetlight goes on and off, making the corner dark and unsafe.",
    location: "10th Bus Stop lane (280m away)",
    citizensAffected: 15,
    upvotes: 5,
    userUpvoted: false,
    coordinates: { x: 45, y: 80 },
    status: "Submitted"
  }
];

export const mockComplaints = [
  {
    id: "CIV-1024",
    category: "Road",
    description: "Large, deep pothole near the main bus stop causing traffic slowdown and tire damage.",
    location: "Main Bus Stop, Gandhipuram",
    latitude: "11.0168",
    longitude: "76.9558",
    dateReported: "Aug 15, 2026",
    priority: "High",
    status: "In Progress",
    assignedDepartment: "Road Maintenance & Infrastructure Authority",
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 15, 2026, 09:30 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 15, 2026, 11:15 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 15, 2026, 02:00 PM", completed: true },
      { status: "In Progress", timestamp: "Aug 16, 2026, 08:30 AM", completed: true },
      { status: "Resolved", timestamp: null, completed: false }
    ],
    authorityUpdate: "Repair team has been assigned, asphalt mixing completed, and on-site inspection is scheduled.",
    resolution: null,
    feedback: null
  },
  {
    id: "CIV-1007",
    category: "Electricity",
    description: "Streetlight broken and hanging dangerously from the pole. Entire street is pitch black after 6 PM.",
    location: "5th Street, Gandhipuram",
    latitude: "11.0175",
    longitude: "76.9562",
    dateReported: "Aug 10, 2026",
    priority: "High",
    status: "Resolved",
    assignedDepartment: "Municipal Electricity & Public Lighting Division",
    image: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 10, 2026, 08:15 PM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 11, 2026, 09:00 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 11, 2026, 11:30 AM", completed: true },
      { status: "In Progress", timestamp: "Aug 12, 2026, 10:00 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 13, 2026, 04:45 PM", completed: true }
    ],
    authorityUpdate: "Technicians replaced the hanging fixture with a modern LED streetlamp.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1473116763269-255ea10e8a21?w=600&auto=format&fit=crop&q=80",
      description: "Hanging fixture safely removed. A brand new energy-efficient LED lamp has been installed and tested.",
      resolvedDate: "Aug 13, 2026"
    },
    feedback: {
      rating: 5,
      comments: "Excellent service! The street is much safer now."
    }
  },
  {
    id: "CIV-1011",
    category: "Drainage",
    description: "Severe block in the drainage pipe causing foul wastewater to overflow onto the pedestrian path.",
    location: "Corner of NPR Layout & Main Rd",
    latitude: "11.0152",
    longitude: "76.9535",
    dateReported: "Aug 12, 2026",
    priority: "Medium",
    status: "In Progress",
    assignedDepartment: "Sanitation & Sewerage Works Board",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 12, 2026, 10:00 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 12, 2026, 02:30 PM", completed: true },
      { status: "Assigned", timestamp: "Aug 13, 2026, 09:00 AM", completed: true },
      { status: "In Progress", timestamp: "Aug 14, 2026, 11:00 AM", completed: true },
      { status: "Resolved", timestamp: null, completed: false }
    ],
    authorityUpdate: "De-clogging vehicle dispatched. Structural block cleared. Team is currently securing side walls.",
    resolution: null,
    feedback: null
  },
  {
    id: "CIV-1012",
    category: "Sanitation",
    description: "Overflowing garbage dump bin near the public park entrance. Litter attracting flies and stray animals.",
    location: "Gandhi Park West Gate",
    latitude: "11.0180",
    longitude: "76.9540",
    dateReported: "Aug 13, 2026",
    priority: "Medium",
    status: "Acknowledged",
    assignedDepartment: "Solid Waste Management Bureau",
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 13, 2026, 03:20 PM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 14, 2026, 10:00 AM", completed: true },
      { status: "Assigned", timestamp: null, completed: false },
      { status: "In Progress", timestamp: null, completed: false },
      { status: "Resolved", timestamp: null, completed: false }
    ],
    authorityUpdate: "Complaint registered. Scheduled for clearance during the morning solid waste collection route.",
    resolution: null,
    feedback: null
  },
  {
    id: "CIV-1002",
    category: "Water",
    description: "Continuous leak in drinking water supply line. Hundreds of liters of clean water going to waste daily.",
    location: "Ramanathapuram Lane 2",
    latitude: "11.0130",
    longitude: "76.9610",
    dateReported: "Aug 02, 2026",
    priority: "High",
    status: "Resolved",
    assignedDepartment: "Water Supply & Sewage Board",
    image: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 02, 2026, 09:00 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 02, 2026, 11:00 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 02, 2026, 04:00 PM", completed: true },
      { status: "In Progress", timestamp: "Aug 03, 2026, 09:30 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 04, 2026, 05:00 PM", completed: true }
    ],
    authorityUpdate: "Leak fixed by replacing the faulty sub-surface valve.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
      description: "Excavation completed, leaky connection replaced, and topsoil repaved.",
      resolvedDate: "Aug 04, 2026"
    },
    feedback: {
      rating: 4,
      comments: "Fitted fast, though the clean up of the mud could have been slightly better."
    }
  },
  {
    id: "CIV-1003",
    category: "Road",
    description: "Unfinished road repair leaving high gravel heaps on the lane, posing skidding risks for two-wheelers.",
    location: "Cross Cut Rd Near signal",
    latitude: "11.0195",
    longitude: "76.9560",
    dateReported: "Aug 05, 2026",
    priority: "Low",
    status: "Resolved",
    assignedDepartment: "Road Maintenance & Infrastructure Authority",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 05, 2026, 11:30 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 05, 2026, 03:00 PM", completed: true },
      { status: "Assigned", timestamp: "Aug 06, 2026, 10:00 AM", completed: true },
      { status: "In Progress", timestamp: "Aug 07, 2026, 08:00 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 08, 2026, 02:00 PM", completed: true }
    ],
    authorityUpdate: "Excess gravel swept, leveling and rolling completed successfully.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1605281317010-fe5fed77a941?w=600&auto=format&fit=crop&q=80",
      description: "Gravel rolled into asphalt and surface cleared.",
      resolvedDate: "Aug 08, 2026"
    },
    feedback: null
  },
  {
    id: "CIV-1004",
    category: "Sanitation",
    description: "Illegal dumping of construction debris by a truck during night hours, completely blocking the walkway.",
    location: "AVR Layout Front Gate",
    latitude: "11.0205",
    longitude: "76.9520",
    dateReported: "Aug 06, 2026",
    priority: "Medium",
    status: "Resolved",
    assignedDepartment: "Solid Waste Management Bureau",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 06, 2026, 07:00 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 06, 2026, 10:00 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 06, 2026, 01:00 PM", completed: true },
      { status: "In Progress", timestamp: "Aug 07, 2026, 08:30 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 07, 2026, 04:00 PM", completed: true }
    ],
    authorityUpdate: "Clearance trucks loaded the bricks and concrete bags. Walkway washed.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1595275372297-f58c44d20244?w=600&auto=format&fit=crop&q=80",
      description: "Debris carted away to the municipal dump yard. The walkway is clear.",
      resolvedDate: "Aug 07, 2026"
    },
    feedback: {
      rating: 5,
      comments: "Fast clearance. Keep cameras here to stop illegal dumping."
    }
  },
  {
    id: "CIV-1005",
    category: "Drainage",
    description: "Sewer backup in the roadside storm drain. Water pooling and foul odors spreading in residential area.",
    location: "Street 4, Ram Nagar",
    latitude: "11.0110",
    longitude: "76.9480",
    dateReported: "Aug 07, 2026",
    priority: "High",
    status: "Resolved",
    assignedDepartment: "Sanitation & Sewerage Works Board",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 07, 2026, 08:45 AM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 07, 2026, 11:00 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 07, 2026, 03:00 PM", completed: true },
      { status: "In Progress", timestamp: "Aug 08, 2026, 09:00 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 09, 2026, 06:00 PM", completed: true }
    ],
    authorityUpdate: "Blocked plastic and silt removed from main storm drain chambers.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
      description: "Plastic logs cleared and high-pressure suction cleaning done.",
      resolvedDate: "Aug 09, 2026"
    },
    feedback: {
      rating: 5,
      comments: "Foul smell has gone. Super glad."
    }
  },
  {
    id: "CIV-1006",
    category: "Electricity",
    description: "Underground cable blowout sparked near tree roots. Fire team cleared spark, but street power is down.",
    location: "Opposite GP Hospital",
    latitude: "11.0145",
    longitude: "76.9585",
    dateReported: "Aug 09, 2026",
    priority: "High",
    status: "Resolved",
    assignedDepartment: "Municipal Electricity & Public Lighting Division",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 09, 2026, 11:00 PM", completed: true },
      { status: "Acknowledged", timestamp: "Aug 10, 2026, 08:00 AM", completed: true },
      { status: "Assigned", timestamp: "Aug 10, 2026, 09:30 AM", completed: true },
      { status: "In Progress", timestamp: "Aug 10, 2026, 11:00 AM", completed: true },
      { status: "Resolved", timestamp: "Aug 10, 2026, 04:30 PM", completed: true }
    ],
    authorityUpdate: "Burnt segment replaced and insulation joints tested.",
    resolution: {
      beforeImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80",
      description: "Main underground fuse and insulated lines replaced. Power fully restored.",
      resolvedDate: "Aug 10, 2026"
    },
    feedback: null
  },
  {
    id: "CIV-1025",
    category: "Water",
    description: "Sewer line leak contaminated drinking water pipeline. Water has strange smell and light brown color.",
    location: "Gandhi Nagar 2nd St",
    latitude: "11.0185",
    longitude: "76.9580",
    dateReported: "Aug 16, 2026",
    priority: "High",
    status: "Submitted",
    assignedDepartment: "Water Supply & Sewage Board",
    image: "https://images.unsplash.com/photo-1518364538800-6bcb3f25da49?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "Aug 16, 2026, 10:15 AM", completed: true },
      { status: "Acknowledged", timestamp: null, completed: false },
      { status: "Assigned", timestamp: null, completed: false },
      { status: "In Progress", timestamp: null, completed: false },
      { status: "Resolved", timestamp: null, completed: false }
    ],
    authorityUpdate: "Complaint registered. Inspection crew dispatched for safety checks.",
    resolution: null,
    feedback: null
  }
];
