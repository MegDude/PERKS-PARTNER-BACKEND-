import React, { createContext, useContext } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    tenants: 'Tenants',
    buildings: 'Buildings',
    apartments: 'Apartments',
    reminders: 'Reminders',
    whatsappAgent: 'WhatsApp Agent',
    settings: 'Settings',
    about: 'About',
    
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    name: 'Name',
    contact: 'Contact',
    layout: 'Layout',
    status: 'Status',
    flat: 'Flat',
    apartment: 'Apartment',
    tenant: 'Tenant',
    rent: 'Rent',
    due: 'Due',
    floors: 'Floors',
    noTenantsFound: 'No tenants found',
    allStatus: 'All Status',
    allFloors: 'All Floors',
    sortBy: 'Sort by',
    flatNumber: 'Flat Number',
    whatsapp: 'WhatsApp',
    nextDue: 'Next Due',
    rentCycle: 'Rent/Cycle',
    occupied: 'Occupied',
    vacant: 'Vacant',
    monthly: 'Monthly',
    
    buildingName: 'Building Name',
    address: 'Address',
    totalFloors: 'Total Floors',
    addBuilding: 'Add Building',
    editBuilding: 'Edit Building',
    
    floor: 'Floor',
    roomType: 'Room Type',
    layoutDetails: 'Layout Details',
    addApartment: 'Add Apartment',
    editApartment: 'Edit Apartment',
    
    tenantName: 'Tenant Name',
    mobile: 'Mobile Number',
    yearlyRent: 'Yearly Rent',
    rentInterval: 'Rent Interval',
    rentPerInterval: 'Rent Per Interval',
    nextPaymentDate: 'Next Payment Date',
    lastPaymentDate: 'Last Payment Date',
    addTenant: 'Add Tenant',
    editTenant: 'Edit Tenant',
    
    paid: 'Paid',
    unpaid: 'Unpaid',
    markAsPaid: 'Mark as Paid',
    paymentStatus: 'Payment Status',
    
    studio: 'Studio',
    oneBedroom: '1-Bedroom',
    twoBedroom: '2-Bedroom',
    threeBedroom: '3-Bedroom',
    fourBedroom: '4-Bedroom',
    penthouse: 'Penthouse',
    
    months: 'months',
    
    totalBuildings: 'Total Buildings',
    totalFlats: 'Total Flats',
    totalTenants: 'Total Tenants',
    collection: 'Collection Rate',
    apartmentManager: 'Apartment Manager',
    buildingOverview: 'Building Overview',
    allTenants: 'All Tenants',
    tenantsRegistered: 'tenants registered',
    paymentReminders: 'Payment Reminders',
    tenantsNeedReminders: 'need reminders',
    sendAllReminders: 'Send All Reminders',
    sendReminder: 'Send Reminder',
    automatedReminders: 'Automated Reminders',
    allCaughtUp: 'All Caught Up!',
    noPendingReminders: 'No pending reminders at the moment.',
    reminderInfo: 'This page shows all unpaid tenants whose rent is due within 3 days or overdue.',
    
    overdue: 'Overdue',
    dueToday: 'Due Today',
    dueSoon: 'Due Soon',
    
    removeTenant: 'Remove Tenant?',
    confirmRemove: 'Are you sure you want to remove',
    from: 'from',
    thisActionCannotBeUndone: 'This action cannot be undone.',
    remove: 'Remove',
    
    reminderSent: 'Reminder sent!',
    receiptSent: 'Receipt sent!',
    tenantAdded: 'Tenant added successfully!',
    tenantUpdated: 'Tenant updated successfully!',
    tenantRemoved: 'Tenant removed successfully!',
    onlyAdminsCanAddTenants: 'Only administrators can add new tenants',
    onlyAdminsCanEditTenants: 'Only administrators can edit tenant details',
    onlyAdminsCanRemoveTenants: 'Only administrators can remove tenants',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  return {
    t: (key) => translations.en[key] || key,
    language: 'en',
    isRTL: false
  };
};

export const LanguageProvider = ({ children }) => {
  return <>{children}</>;
};