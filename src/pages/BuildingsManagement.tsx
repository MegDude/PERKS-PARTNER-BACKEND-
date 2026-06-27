import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';

type ModalType = 'profile' | 'unit' | 'resident' | 'amenity' | 'document' | null;

const buildingTabs = [
  { value: 'profile', label: 'Profile' },
  { value: 'units', label: 'Units' },
  { value: 'residents', label: 'Residents' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'surveys', label: 'Surveys' },
  { value: 'access', label: 'Access' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'documents', label: 'Documents' },
  { value: 'reporting', label: 'Reporting' },
];

const legacyTabs: Record<string, string> = {
  apartments: 'units',
  tenants: 'residents',
};

const unitStatuses = ['vacant', 'occupied', 'notice_given', 'offline'];
const accessStatuses = ['active', 'pending', 'disabled'];
const onboardingStatuses = ['not_started', 'invited', 'active', 'complete'];
const amenityCategories = ['Wellness', 'Outdoor', 'Work', 'Hospitality', 'Parking', 'Pet', 'Other'];
const documentCategories = ['Welcome Guide', 'Policy', 'Leasing Document', 'Partner Agreement', 'Resident Resource', 'Other'];

const buildingTabDescriptions: Record<string, string> = {
  profile: 'Building record',
  units: 'Inventory',
  residents: 'People and access',
  amenities: 'Shared spaces',
  surveys: 'Feedback',
  access: 'Cards and QR',
  engagement: 'Activity',
  documents: 'Resources',
  reporting: 'Exports',
};

const fetchProperties = async () => {
  const res = await fetch('/api/properties');
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
};

function emptyUnit(buildingId: string) {
  return {
    building_id: buildingId,
    flat_number: '',
    floor: '',
    room_type: '1-Bedroom',
    beds: 1,
    baths: 1,
    sqft: '',
    is_occupied: false,
    occupancy_status: 'vacant',
    resident_id: '',
    move_in_date: '',
    move_out_date: '',
    access_status: 'pending',
    onboarding_status: 'not_started',
    active: true,
  };
}

function emptyResident(buildingId: string, unitId = '') {
  return {
    building_id: buildingId,
    flat_id: unitId,
    name: '',
    email: '',
    mobile_number: '',
    move_in_date: '',
    lease_end_date: '',
    payment_status: 'pending',
    perks_enrolled: false,
    access_status: 'pending',
    card_status: 'not_issued',
    resident_status: 'invited',
  };
}

function emptyAmenity(buildingId: string) {
  return {
    building_id: buildingId,
    name: '',
    category: 'Other',
    description: '',
    hours_start: '08:00',
    hours_end: '20:00',
    capacity: '',
    access_rules: 'Residents only',
    usage_count: 0,
    is_active: true,
    status: 'active',
  };
}

function emptyDocument(buildingId: string) {
  return {
    building_id: buildingId,
    title: '',
    category: 'Welcome Guide',
    file_name: '',
    file_url: '',
    version: '1.0',
    permission_group: 'Property team',
    status: 'active',
  };
}

function toCsv(rows: any[], columns: Array<{ key: string; label: string }>) {
  const escape = (value: any) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [columns.map((column) => escape(column.label)).join(','), ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(','))].join('\n');
}

function downloadFile(fileName: string, body: string, type = 'text/csv') {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function BuildingTabRail({ activeTab }: { activeTab: string }) {
  return (
    <nav aria-label="Building workspace areas" className="mb-4 max-w-full overflow-x-auto border-b border-[#11182B]/10 bg-white [scrollbar-width:thin]">
      <div className="flex min-w-max gap-1">
        {buildingTabs.map((item) => {
          const active = activeTab === item.value;
          return (
            <Link
              key={item.value}
              to={`/admin/buildings/${item.value}`}
              aria-current={active ? 'page' : undefined}
              className={`grid min-h-10 shrink-0 border-b-2 px-2.5 pb-2 pt-2 text-left transition-colors hover:text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#11182B] focus:ring-offset-2 ${
                active ? 'border-[#C8A96A] text-[#0B1F33]' : 'border-transparent text-[rgba(11,31,51,0.58)]'
              }`}
            >
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
              <span className="mt-1 hidden text-[10px] font-medium leading-none text-[rgba(11,31,51,0.46)] sm:block">{buildingTabDescriptions[item.value]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(',').map((item) => item.trim());
  return lines.map((line) => {
    const values = line.split(',').map((item) => item.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

export default function BuildingsManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tab = 'profile' } = useParams();
  const activeTab = legacyTabs[tab] || tab;
  const validTab = buildingTabs.some((item) => item.value === activeTab);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [unitSearch, setUnitSearch] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [unitSort, setUnitSort] = useState('unit');
  const [residentSearch, setResidentSearch] = useState('');
  const [amenitySearch, setAmenitySearch] = useState('');

  const { data: buildings = [], isLoading } = useQuery({ queryKey: ['buildings-api'], queryFn: fetchProperties });
  const { data: units = [] } = useQuery({ queryKey: ['building-units'], queryFn: () => base44.entities.Flat.list() });
  const { data: residents = [] } = useQuery({ queryKey: ['building-residents'], queryFn: () => base44.entities.Tenant.list() });
  const { data: amenities = [] } = useQuery({ queryKey: ['building-amenities'], queryFn: () => base44.entities.Amenity.list() });
  const { data: surveys = [] } = useQuery({ queryKey: ['building-surveys'], queryFn: () => base44.entities.Survey.list() });
  const { data: surveyResponses = [] } = useQuery({ queryKey: ['building-survey-responses'], queryFn: () => base44.entities.SurveyResponse.list() });
  const { data: broadcasts = [] } = useQuery({ queryKey: ['building-broadcasts'], queryFn: () => base44.entities.Broadcast.list() });
  const { data: redemptions = [] } = useQuery({ queryKey: ['building-redemptions'], queryFn: () => base44.entities.PerkRedemption.list() });
  const { data: events = [] } = useQuery({ queryKey: ['building-events'], queryFn: () => base44.entities.Event.list() });
  const { data: documents = [] } = useQuery({ queryKey: ['building-documents'], queryFn: () => base44.entities.BuildingDocument.list() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['building-audit-logs'], queryFn: () => base44.entities.TenantAuditLog.list() });

  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      const theShore = buildings.find((b: any) => b.name === 'The Shore') || buildings[0];
      setSelectedBuildingId(theShore.id);
    }
  }, [buildings, selectedBuildingId]);

  useEffect(() => {
    if (!validTab) {
      navigate('/admin/buildings/profile', { replace: true });
    }
  }, [navigate, validTab]);

  const selectedBuilding = buildings.find((building: any) => building.id === selectedBuildingId);
  const buildingUnits = useMemo(() => units.filter((unit: any) => unit.building_id === selectedBuildingId), [units, selectedBuildingId]);
  const buildingResidents = useMemo(() => {
    const unitIds = new Set(buildingUnits.map((unit: any) => unit.id));
    return residents.filter((resident: any) => resident.building_id === selectedBuildingId || unitIds.has(resident.flat_id));
  }, [residents, buildingUnits, selectedBuildingId]);
  const buildingAmenities = amenities.filter((amenity: any) => amenity.building_id === selectedBuildingId);
  const buildingSurveys = surveys.filter((survey: any) => survey.building_id === selectedBuildingId);
  const buildingSurveyResponses = surveyResponses.filter((response: any) => response.building_id === selectedBuildingId);
  const buildingBroadcasts = broadcasts.filter((broadcast: any) => broadcast.building_id === selectedBuildingId);
  const buildingRedemptions = redemptions.filter((redemption: any) => redemption.propertyId === selectedBuildingId || redemption.building_id === selectedBuildingId);
  const buildingEvents = events.filter((event: any) => event.building_id === selectedBuildingId);
  const buildingDocuments = documents.filter((document: any) => document.building_id === selectedBuildingId);
  const buildingAuditLogs = auditLogs.filter((log: any) => log.organization_id === selectedBuildingId || log.building_id === selectedBuildingId || log.resource_id === selectedBuildingId);

  const occupiedUnits = buildingUnits.filter((unit: any) => unit.is_occupied || unit.occupancy_status === 'occupied').length;
  const occupancy = buildingUnits.length ? Math.round((occupiedUnits / buildingUnits.length) * 100) : 0;
  const activeResidents = buildingResidents.filter((resident: any) => resident.resident_status !== 'inactive' && resident.resident_status !== 'cancelled').length;
  const activeAccess = buildingResidents.filter((resident: any) => resident.access_status === 'active' || resident.perks_enrolled).length;

  const invalidateOperations = () => {
    queryClient.invalidateQueries({ queryKey: ['buildings-api'] });
    queryClient.invalidateQueries({ queryKey: ['building-units'] });
    queryClient.invalidateQueries({ queryKey: ['building-residents'] });
    queryClient.invalidateQueries({ queryKey: ['building-amenities'] });
    queryClient.invalidateQueries({ queryKey: ['building-documents'] });
    queryClient.invalidateQueries({ queryKey: ['building-audit-logs'] });
  };

  const logAction = async (action: string, resource: string, resourceId?: string, detail?: string) => {
    await base44.entities.TenantAuditLog.create({
      user_id: 'user_admin',
      organization_id: selectedBuildingId,
      building_id: selectedBuildingId,
      action,
      resource,
      resource_id: resourceId || selectedBuildingId,
      detail,
      timestamp: new Date().toISOString(),
    });
  };

  const saveUnit = useMutation({
    mutationFn: async (payload: any) => {
      const normalized = {
        ...payload,
        floor: Number(payload.floor || 0),
        beds: Number(payload.beds || 0),
        baths: Number(payload.baths || 0),
        sqft: Number(payload.sqft || 0),
        is_occupied: payload.occupancy_status === 'occupied',
      };
      if (editingRecord?.id) return base44.entities.Flat.update(editingRecord.id, normalized);
      return base44.entities.Flat.create(normalized);
    },
    onSuccess: async (record) => {
      await base44.entities.Building.update(selectedBuildingId, {
        units: Math.max(Number(selectedBuilding?.units || 0), buildingUnits.length + (editingRecord?.id ? 0 : 1)),
        totalUnits: Math.max(Number(selectedBuilding?.totalUnits || 0), buildingUnits.length + (editingRecord?.id ? 0 : 1)),
      });
      await logAction(editingRecord?.id ? 'unit.updated' : 'unit.created', 'Flat', record.id, record.flat_number);
      toast.success(editingRecord?.id ? 'Unit updated' : 'Unit created');
      closeModal();
      invalidateOperations();
    },
    onError: (error: any) => toast.error(error.message || 'Unit could not be saved'),
  });

  const saveResident = useMutation({
    mutationFn: async (payload: any) => {
      if (editingRecord?.id) return base44.entities.Tenant.update(editingRecord.id, payload);
      return base44.entities.Tenant.create(payload);
    },
    onSuccess: async (record) => {
      await logAction(editingRecord?.id ? 'resident.updated' : 'resident.invited', 'Tenant', record.id, record.email);
      toast.success(editingRecord?.id ? 'Resident updated' : 'Resident invited');
      closeModal();
      invalidateOperations();
    },
    onError: (error: any) => toast.error(error.message || 'Resident could not be saved'),
  });

  const saveAmenity = useMutation({
    mutationFn: async (payload: any) => {
      const normalized = { ...payload, capacity: Number(payload.capacity || 0), usage_count: Number(payload.usage_count || 0), is_active: payload.status === 'active' };
      if (editingRecord?.id) return base44.entities.Amenity.update(editingRecord.id, normalized);
      return base44.entities.Amenity.create(normalized);
    },
    onSuccess: async (record) => {
      await logAction(editingRecord?.id ? 'amenity.updated' : 'amenity.created', 'Amenity', record.id, record.name);
      toast.success(editingRecord?.id ? 'Amenity updated' : 'Amenity created');
      closeModal();
      invalidateOperations();
    },
    onError: (error: any) => toast.error(error.message || 'Amenity could not be saved'),
  });

  const saveDocument = useMutation({
    mutationFn: async (payload: any) => {
      if (editingRecord?.id) return base44.entities.BuildingDocument.update(editingRecord.id, payload);
      return base44.entities.BuildingDocument.create(payload);
    },
    onSuccess: async (record) => {
      await logAction(editingRecord?.id ? 'document.updated' : 'document.created', 'BuildingDocument', record.id, record.title);
      toast.success(editingRecord?.id ? 'Document updated' : 'Document added');
      closeModal();
      invalidateOperations();
    },
    onError: (error: any) => toast.error(error.message || 'Document could not be saved'),
  });

  const saveProfile = useMutation({
    mutationFn: (payload: any) => base44.entities.Building.update(selectedBuildingId, payload),
    onSuccess: async () => {
      await logAction('building.updated', 'Building', selectedBuildingId, selectedBuilding?.name);
      toast.success('Building profile updated');
      closeModal();
      invalidateOperations();
    },
    onError: (error: any) => toast.error(error.message || 'Building could not be updated'),
  });

  const openModal = (type: Exclude<ModalType, null>, record?: any) => {
    setModalType(type);
    setEditingRecord(record || null);
    if (type === 'profile') setForm({ ...selectedBuilding, amenities: (selectedBuilding?.amenities || []).join(', ') });
    if (type === 'unit') setForm(record || emptyUnit(selectedBuildingId));
    if (type === 'resident') setForm(record || emptyResident(selectedBuildingId, buildingUnits[0]?.id || ''));
    if (type === 'amenity') setForm(record || emptyAmenity(selectedBuildingId));
    if (type === 'document') setForm(record || emptyDocument(selectedBuildingId));
  };

  const closeModal = () => {
    setModalType(null);
    setEditingRecord(null);
    setForm({});
  };

  const archiveUnit = async (unit: any) => {
    await base44.entities.Flat.update(unit.id, { active: false, occupancy_status: 'offline', is_occupied: false });
    await logAction('unit.archived', 'Flat', unit.id, unit.flat_number);
    toast.success('Unit archived');
    invalidateOperations();
  };

  const deleteUnit = async (unit: any) => {
    if (!window.confirm(`Delete unit ${unit.flat_number}? This cannot be undone.`)) return;
    await base44.entities.Flat.delete(unit.id);
    await logAction('unit.deleted', 'Flat', unit.id, unit.flat_number);
    toast.success('Unit deleted');
    invalidateOperations();
  };

  const updateResidentAccess = async (resident: any, accessStatus: string) => {
    await base44.entities.Tenant.update(resident.id, {
      access_status: accessStatus,
      perks_enrolled: accessStatus === 'active',
      card_status: accessStatus === 'active' ? 'active' : resident.card_status || 'not_issued',
    });
    await logAction('resident.access_updated', 'Tenant', resident.id, accessStatus);
    toast.success('Resident access updated');
    invalidateOperations();
  };

  const archiveDocument = async (document: any) => {
    await base44.entities.BuildingDocument.update(document.id, { status: 'archived' });
    await logAction('document.archived', 'BuildingDocument', document.id, document.title);
    toast.success('Document archived');
    invalidateOperations();
  };

  const updateBuildingStatus = async (status: string) => {
    await base44.entities.Building.update(selectedBuildingId, { status });
    await logAction(`building.${status}`, 'Building', selectedBuildingId, selectedBuilding?.name);
    toast.success(`Building marked ${status}`);
    invalidateOperations();
  };

  const exportUnits = () => {
    downloadFile(
      `${selectedBuilding?.name || 'building'}-units.csv`,
      toCsv(buildingUnits, [
        { key: 'flat_number', label: 'Unit Number' },
        { key: 'floor', label: 'Floor' },
        { key: 'room_type', label: 'Unit Type' },
        { key: 'beds', label: 'Bedrooms' },
        { key: 'baths', label: 'Bathrooms' },
        { key: 'sqft', label: 'Square Footage' },
        { key: 'occupancy_status', label: 'Occupancy Status' },
        { key: 'access_status', label: 'Access Status' },
        { key: 'onboarding_status', label: 'Onboarding Status' },
      ]),
    );
    toast.success('Units exported');
  };

  const exportReport = () => {
    const rows = [
      { metric: 'Units', value: buildingUnits.length },
      { metric: 'Residents', value: buildingResidents.length },
      { metric: 'Occupancy', value: `${occupancy}%` },
      { metric: 'Surveys', value: buildingSurveys.length },
      { metric: 'Survey Responses', value: buildingSurveyResponses.length },
      { metric: 'Amenities', value: buildingAmenities.length },
      { metric: 'Resident Actions', value: buildingRedemptions.length + buildingBroadcasts.length },
    ];
    downloadFile(`${selectedBuilding?.name || 'building'}-operations-report.csv`, toCsv(rows, [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }]));
    logAction('report.exported', 'Building', selectedBuildingId, 'CSV operations report');
  };

  const downloadTemplate = () => {
    downloadFile('downtown-perks-unit-import-template.csv', 'flat_number,floor,room_type,beds,baths,sqft,occupancy_status,access_status,onboarding_status\n1201,12,1-Bedroom,1,1,760,vacant,pending,not_started\n');
  };

  const importUnits = async (file?: File) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) {
      toast.error('No unit rows found in CSV');
      return;
    }
    await Promise.all(
      rows.map((row) =>
        base44.entities.Flat.create({
          building_id: selectedBuildingId,
          flat_number: row.flat_number || row.unit || row.unit_number,
          floor: Number(row.floor || 0),
          room_type: row.room_type || row.unit_type || 'Unit',
          beds: Number(row.beds || row.bedrooms || 0),
          baths: Number(row.baths || row.bathrooms || 0),
          sqft: Number(row.sqft || row.square_footage || 0),
          occupancy_status: row.occupancy_status || 'vacant',
          access_status: row.access_status || 'pending',
          onboarding_status: row.onboarding_status || 'not_started',
          is_occupied: row.occupancy_status === 'occupied',
          active: true,
        }),
      ),
    );
    await logAction('units.imported', 'Flat', selectedBuildingId, `${rows.length} units`);
    toast.success(`${rows.length} units imported`);
    invalidateOperations();
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const filteredUnits = buildingUnits
    .filter((unit: any) => unit.active !== false)
    .filter((unit: any) => unitStatusFilter === 'all' || (unit.occupancy_status || (unit.is_occupied ? 'occupied' : 'vacant')) === unitStatusFilter)
    .filter((unit: any) => {
      const haystack = `${unit.flat_number} ${unit.room_type} ${unit.floor}`.toLowerCase();
      return haystack.includes(unitSearch.toLowerCase());
    })
    .sort((a: any, b: any) => {
      if (unitSort === 'floor') return Number(a.floor || 0) - Number(b.floor || 0);
      if (unitSort === 'status') return String(a.occupancy_status || '').localeCompare(String(b.occupancy_status || ''));
      return String(a.flat_number || '').localeCompare(String(b.flat_number || ''), undefined, { numeric: true });
    });

  const filteredResidents = buildingResidents.filter((resident: any) => `${resident.name} ${resident.email} ${resident.mobile_number}`.toLowerCase().includes(residentSearch.toLowerCase()));
  const filteredAmenities = buildingAmenities.filter((amenity: any) => `${amenity.name} ${amenity.category} ${amenity.status}`.toLowerCase().includes(amenitySearch.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white text-[#11182B]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading buildings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#11182B]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 pb-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase text-[#C5A028]">Buildings</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#11182B] sm:text-3xl">Building workspace</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6b7a]">
                Open a building, then manage the people, spaces, access, notes, surveys, files, and reporting tied to that address.
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-[11px] font-bold uppercase text-[#6E7785]">Active building</label>
              <select
                value={selectedBuildingId}
                onChange={(event) => setSelectedBuildingId(event.target.value)}
                className="min-h-11 border-0 border-b border-[#11182B]/20 bg-white px-0 text-sm font-semibold text-[#11182B] outline-none focus:border-[#C5A028]"
              >
                {buildings.map((building: any) => (
                  <option key={building.id} value={building.id}>{building.name}</option>
                ))}
              </select>
              <span className="text-xs text-[#6E7785]">{selectedBuilding?.address || 'No address on record'}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-x-5 gap-y-3 border-t border-[#11182B]/10 pt-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            <ModuleBrief label="Building record" detail="Address, property details, notes, contacts, and the core profile." />
            <ModuleBrief label="Residents and access" detail="Units, resident records, invitations, cards, and access status." />
            <ModuleBrief label="Amenities and files" detail="Shared spaces, rules, documents, guides, and building resources." />
            <ModuleBrief label="Surveys and reports" detail="Feedback, exports, activity history, and building-ready reporting." />
          </div>
        </header>

        <BuildingTabRail activeTab={validTab ? activeTab : 'profile'} />

        <Tabs value={validTab ? activeTab : 'profile'}>

          <TabsContent value="profile">
            <SectionShell
              eyebrow="Building profile"
              title={selectedBuilding?.name || 'Building profile'}
              description="The building record that keeps units, residents, access, surveys, and reports pointing the same way."
              action={<Button onClick={() => openModal('profile')}><Edit3 className="h-4 w-4" /> Edit profile</Button>}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Address" value={selectedBuilding?.address} />
                  <Info label="Property Type" value={selectedBuilding?.type || selectedBuilding?.property_type} />
                  <Info label="Management Company" value={selectedBuilding?.management_company || 'Downtown Perks managed'} />
                  <Info label="Status" value={selectedBuilding?.status} />
                  <Info label="Partner Status" value={selectedBuilding?.partner_status || 'active'} />
                  <Info label="Launch Date" value={selectedBuilding?.launch_date || selectedBuilding?.created_at?.slice(0, 10)} />
                  <Info label="QR Entry Points" value={selectedBuilding?.qr_entry_points || selectedBuilding?.accessCode || 'Not configured'} />
                  <Info label="Campaign Participation" value={`${buildingBroadcasts.length + buildingEvents.length} active records`} />
                </div>
                <div className="border-y border-[#11182B]/10 py-4">
                  <h3 className="text-sm font-semibold">Required actions</h3>
                  <div className="mt-3 grid gap-2 text-sm text-[#5f6b7a]">
                    <StatusLine done={buildingUnits.length > 0} text="Unit inventory exists" />
                    <StatusLine done={buildingResidents.length > 0} text="Residents connected" />
                    <StatusLine done={buildingAmenities.length > 0} text="Amenities configured" />
                    <StatusLine done={buildingSurveys.length > 0} text="Survey program active" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => updateBuildingStatus('archived')}><Archive className="h-4 w-4" /> Archive</Button>
                    <Button variant="secondary" onClick={() => updateBuildingStatus('inactive')}>Deactivate</Button>
                    <Button variant="secondary" onClick={() => navigate('/admin/buildings/reporting')}>View Reporting</Button>
                  </div>
                </div>
              </div>
              <AuditTrail logs={buildingAuditLogs} />
            </SectionShell>
          </TabsContent>

          <TabsContent value="units">
            <SectionShell
              eyebrow="Unit inventory"
              title="Units and occupancy"
              description="Add units, assign residents, check access, import a list, or export the building record."
              action={<Button onClick={() => openModal('unit')}><Plus className="h-4 w-4" /> Add unit</Button>}
            >
              <Toolbar>
                <SearchBox value={unitSearch} onChange={setUnitSearch} placeholder="Search units" />
                <select value={unitStatusFilter} onChange={(event) => setUnitStatusFilter(event.target.value)} className="dp-admin-select">
                  <option value="all">All statuses</option>
                  {unitStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                </select>
                <select value={unitSort} onChange={(event) => setUnitSort(event.target.value)} className="dp-admin-select">
                  <option value="unit">Sort by unit</option>
                  <option value="floor">Sort by floor</option>
                  <option value="status">Sort by status</option>
                </select>
                <Button variant="secondary" onClick={downloadTemplate}><Download className="h-4 w-4" /> Template</Button>
                <Button variant="secondary" onClick={() => importInputRef.current?.click()}><Upload className="h-4 w-4" /> Import</Button>
                <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => importUnits(event.target.files?.[0])} />
                <Button variant="secondary" onClick={exportUnits}><Download className="h-4 w-4" /> Export</Button>
              </Toolbar>
              {filteredUnits.length ? (
                <div className="overflow-x-auto border-y border-[#11182B]/10">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="text-[11px] font-bold uppercase text-[#6E7785]">
                      <tr>
                        {['Unit', 'Floor', 'Type', 'Beds/Baths', 'Sqft', 'Occupancy', 'Resident', 'Access', 'Onboarding', 'Actions'].map((head) => <th key={head} className="py-3 pr-4">{head}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#11182B]/8">
                      {filteredUnits.map((unit: any) => {
                        const resident = buildingResidents.find((item: any) => item.flat_id === unit.id || item.id === unit.resident_id);
                        return (
                          <tr key={unit.id}>
                            <td className="py-3 pr-4 font-semibold">{unit.flat_number}</td>
                            <td className="py-3 pr-4">{unit.floor}</td>
                            <td className="py-3 pr-4">{unit.room_type}</td>
                            <td className="py-3 pr-4">{unit.beds || 0}/{unit.baths || 0}</td>
                            <td className="py-3 pr-4">{unit.sqft || '-'}</td>
                            <td className="py-3 pr-4">{unit.occupancy_status || (unit.is_occupied ? 'occupied' : 'vacant')}</td>
                            <td className="py-3 pr-4">{resident?.name || 'Unassigned'}</td>
                            <td className="py-3 pr-4">{unit.access_status || 'pending'}</td>
                            <td className="py-3 pr-4">{unit.onboarding_status || 'not started'}</td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-2">
                                <IconButton label="Edit unit" onClick={() => openModal('unit', unit)} icon={<Edit3 className="h-4 w-4" />} />
                                <IconButton label="Archive unit" onClick={() => archiveUnit(unit)} icon={<Archive className="h-4 w-4" />} />
                                <IconButton label="Delete unit" onClick={() => deleteUnit(unit)} icon={<Trash2 className="h-4 w-4" />} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No units added yet" body="Start by adding a unit, importing a CSV, downloading the template, or reviewing setup requirements." actions={<><Button onClick={() => openModal('unit')}><Plus className="h-4 w-4" /> Add Unit</Button><Button variant="secondary" onClick={downloadTemplate}>Download Template</Button><Button variant="secondary" onClick={() => importInputRef.current?.click()}>Import Units</Button></>} />
              )}
            </SectionShell>
          </TabsContent>

          <TabsContent value="residents">
            <SectionShell
              eyebrow="Residents"
              title="Residents and access"
              description="Invite residents, assign units, update card access, and review what has changed."
              action={<Button onClick={() => openModal('resident')}><Plus className="h-4 w-4" /> Invite resident</Button>}
            >
              <Toolbar><SearchBox value={residentSearch} onChange={setResidentSearch} placeholder="Search residents" /></Toolbar>
              <div className="grid gap-3">
                {filteredResidents.map((resident: any) => {
                  const unit = buildingUnits.find((item: any) => item.id === resident.flat_id);
                  return (
                    <article key={resident.id} className="grid gap-3 border-y border-[#11182B]/10 py-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <h3 className="text-sm font-semibold">{resident.name}</h3>
                        <p className="text-sm text-[#6E7785]">{resident.email} {unit?.flat_number ? `• Unit ${unit.flat_number}` : ''}</p>
                        <p className="mt-1 text-xs text-[#6E7785]">Status: {resident.resident_status || 'active'} • Card: {resident.card_status || (resident.perks_enrolled ? 'active' : 'not issued')}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openModal('resident', resident)}>Edit</Button>
                        <Button variant="secondary" onClick={() => updateResidentAccess(resident, 'active')}>Activate</Button>
                        <Button variant="secondary" onClick={() => updateResidentAccess(resident, 'disabled')}>Disable</Button>
                      </div>
                    </article>
                  );
                })}
                {!filteredResidents.length && <EmptyState title="No residents connected" body="Invite a resident or assign an existing resident to a unit so access, surveys, and engagement can be tracked." actions={<Button onClick={() => openModal('resident')}><Plus className="h-4 w-4" /> Invite Resident</Button>} />}
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="amenities">
            <SectionShell eyebrow="Amenities" title="Building amenities" description="Hours, status, access rules, and usage in one clean list." action={<Button onClick={() => openModal('amenity')}><Plus className="h-4 w-4" /> Add amenity</Button>}>
              <Toolbar><SearchBox value={amenitySearch} onChange={setAmenitySearch} placeholder="Search amenities" /></Toolbar>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredAmenities.map((amenity: any) => (
                  <article key={amenity.id} className="border-y border-[#11182B]/10 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase text-[#C5A028]">{amenity.category || 'Amenity'}</p>
                        <h3 className="mt-1 text-base font-semibold">{amenity.name}</h3>
                        <p className="mt-1 text-sm text-[#6E7785]">{amenity.description || 'No description yet.'}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#6E7785]">{amenity.status || (amenity.is_active ? 'active' : 'disabled')}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[#6E7785] sm:grid-cols-3">
                      <span>Hours: {amenity.hours_start}-{amenity.hours_end}</span>
                      <span>Capacity: {amenity.capacity || '-'}</span>
                      <span>Usage: {amenity.usage_count || 0}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openModal('amenity', amenity)}>Edit</Button>
                      <Button variant="secondary" onClick={async () => { await base44.entities.Amenity.update(amenity.id, { status: 'disabled', is_active: false }); await logAction('amenity.disabled', 'Amenity', amenity.id, amenity.name); toast.success('Amenity disabled'); invalidateOperations(); }}>Disable</Button>
                    </div>
                  </article>
                ))}
                {!filteredAmenities.length && <EmptyState title="No amenities configured" body="Add amenities so onboarding, access rules, usage tracking, and resident feedback can connect to the building record." actions={<Button onClick={() => openModal('amenity')}><Plus className="h-4 w-4" /> Add Amenity</Button>} />}
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="surveys">
            <SectionShell eyebrow="Surveys" title="Ask residents what they think" description="Create, publish, close, review, and export building surveys." action={<Button onClick={() => navigate('/admin/surveys')}><Plus className="h-4 w-4" /> Create survey</Button>}>
              <div className="grid gap-3">
                {buildingSurveys.map((survey: any) => (
                  <Row key={survey.id} title={survey.title} detail={`${survey.status} • ${survey.responses_count || 0} responses • ${survey.ends_at || 'No end date'}`} actions={<><Button variant="secondary" onClick={() => navigate('/admin/surveys')}>Manage</Button><Button variant="secondary" onClick={() => downloadFile(`${survey.title}-responses.csv`, toCsv(buildingSurveyResponses, [{ key: 'resident_name', label: 'Resident' }, { key: 'resident_email', label: 'Email' }, { key: 'score', label: 'Score' }, { key: 'sentiment', label: 'Sentiment' }]))}>Export</Button></>} />
                ))}
                {!buildingSurveys.length && <EmptyState title="No surveys active" body="Create a satisfaction, event feedback, perk feedback, or NPS survey for this building." actions={<Button onClick={() => navigate('/admin/surveys')}>Create Survey</Button>} />}
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="access">
            <SectionShell eyebrow="Access" title="Resident and staff access" description="Review invite status, QR access, resident cards, building rules, partner access, and staff groups.">
              <div className="dp-summary-matrix">
                <div className="dp-summary-matrix__grid">
                <Metric label="Invited" value={buildingResidents.filter((r: any) => r.resident_status === 'invited').length} detail="Pending residents" />
                <Metric label="Activated" value={activeAccess} detail="Cards or perks active" />
                <Metric label="Disabled" value={buildingResidents.filter((r: any) => r.access_status === 'disabled').length} detail="Access blocked" />
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {buildingResidents.map((resident: any) => (
                  <Row key={resident.id} title={resident.name} detail={`${resident.email} • Access: ${resident.access_status || 'pending'} • Card: ${resident.card_status || 'not issued'}`} actions={<><Button variant="secondary" onClick={() => updateResidentAccess(resident, 'active')}>Activate</Button><Button variant="secondary" onClick={() => updateResidentAccess(resident, 'disabled')}>Disable</Button></>} />
                ))}
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="engagement">
            <SectionShell eyebrow="Participation" title="What residents are doing" description="Building activity from residents, perk use, surveys, events, and messages.">
              <div className="dp-summary-matrix">
                <div className="dp-summary-matrix__grid">
                <Metric label="Residents invited" value={buildingResidents.length} detail="CRM records" />
                <Metric label="Residents active" value={activeResidents} detail="Active resident status" />
                <Metric label="Perks redemptions" value={buildingRedemptions.length} detail="Verified actions" />
                <Metric label="Survey responses" value={buildingSurveyResponses.length} detail="Completed feedback" />
                <Metric label="Broadcasts" value={buildingBroadcasts.length} detail="Messages sent" />
                <Metric label="Participation" value={`${activeResidents ? Math.round(((buildingRedemptions.length + buildingSurveyResponses.length) / activeResidents) * 100) : 0}%`} detail="Actions per active resident" />
                </div>
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="documents">
            <SectionShell eyebrow="Documents" title="Building resources" description="Keep leasing documents, welcome guides, partner agreements, policies, and resident resources easy to find." action={<Button onClick={() => openModal('document')}><Plus className="h-4 w-4" /> Add document</Button>}>
              <div className="grid gap-3">
                {buildingDocuments.map((document: any) => (
                  <Row key={document.id} title={document.title} detail={`${document.category} • Version ${document.version || '1.0'} • ${document.permission_group || 'Property team'} • ${document.status || 'active'}`} actions={<><Button variant="secondary" onClick={() => openModal('document', document)}>Edit</Button><Button variant="secondary" onClick={() => document.file_url ? window.open(document.file_url, '_blank') : toast.info('No file URL is attached yet')}>Download</Button><Button variant="secondary" onClick={() => archiveDocument(document)}>Archive</Button></>} />
                ))}
                {!buildingDocuments.length && <EmptyState title="No documents added yet" body="Add policies, welcome guides, leasing documents, partner agreements, or resident resources for this building." actions={<Button onClick={() => openModal('document')}><FileText className="h-4 w-4" /> Add Document</Button>} />}
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="reporting">
            <SectionShell eyebrow="Reports" title="Share a clean building report" description="Export the building, unit, resident, survey, amenity, and participation details." action={<Button onClick={exportReport}><Download className="h-4 w-4" /> Export CSV</Button>}>
              <div className="dp-summary-matrix">
                <div className="dp-summary-matrix__grid">
                <Metric label="Buildings" value={buildings.length} detail="Properties in the program" />
                <Metric label="Units" value={buildingUnits.length} detail={`${occupancy}% occupied`} />
                <Metric label="Residents" value={buildingResidents.length} detail={`${activeAccess} access active`} />
                <Metric label="Amenities" value={buildingAmenities.length} detail="Building amenities" />
                <Metric label="Surveys" value={buildingSurveys.length} detail={`${buildingSurveyResponses.length} responses`} />
                <Metric label="Reports" value={buildingAuditLogs.filter((log: any) => String(log.action).includes('report')).length} detail="Generated exports" />
                </div>
              </div>
            </SectionShell>
          </TabsContent>
        </Tabs>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11182B]/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-[0_18px_50px_rgba(11,31,51,0.18)]">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#11182B]/10 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#C5A028]">{editingRecord?.id ? 'Edit' : 'Create'}</p>
                <h2 className="text-xl font-semibold capitalize">{modalType}</h2>
              </div>
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            </div>
            {modalType === 'profile' && <ProfileForm form={form} setForm={setForm} onSubmit={() => saveProfile.mutate({ ...form, amenities: String(form.amenities || '').split(',').map((item) => item.trim()).filter(Boolean) })} loading={saveProfile.isPending} />}
            {modalType === 'unit' && <UnitForm form={form} setForm={setForm} residents={buildingResidents} onSubmit={() => saveUnit.mutate(form)} loading={saveUnit.isPending} />}
            {modalType === 'resident' && <ResidentForm form={form} setForm={setForm} units={buildingUnits} onSubmit={() => saveResident.mutate(form)} loading={saveResident.isPending} />}
            {modalType === 'amenity' && <AmenityForm form={form} setForm={setForm} onSubmit={() => saveAmenity.mutate(form)} loading={saveAmenity.isPending} />}
            {modalType === 'document' && <DocumentForm form={form} setForm={setForm} onSubmit={() => saveDocument.mutate(form)} loading={saveDocument.isPending} />}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionShell({ eyebrow, title, description, action, children }: any) {
  return (
    <section className="py-1">
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase text-[#C5A028]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-[#11182B] sm:text-2xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6b7a]">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ModuleBrief({ label, detail }: any) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C5A028]">{label}</div>
      <p className="mt-1 text-[12px] leading-5 text-[#5f6b7a]">{detail}</p>
    </div>
  );
}

function Metric({ label, value, detail }: any) {
  return (
    <div className="dp-summary-matrix__item">
      <div className="dp-summary-matrix__label">{label}</div>
      <div className="dp-summary-matrix__value">{value}</div>
      <div className="dp-summary-matrix__detail">{detail}</div>
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div className="border-y border-[#11182B]/10 py-3">
      <p className="text-[11px] font-bold uppercase text-[#6E7785]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#11182B]">{value || 'Not set'}</p>
    </div>
  );
}

function StatusLine({ done, text }: any) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={`h-4 w-4 ${done ? 'text-[#C5A028]' : 'text-[#A6ADB8]'}`} />
      <span>{text}</span>
    </div>
  );
}

function Toolbar({ children }: any) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

function SearchBox({ value, onChange, placeholder }: any) {
  return (
    <label className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E7785]" />
      <Input value={value} onChange={(event: any) => onChange(event.target.value)} placeholder={placeholder} className="pl-6" />
    </label>
  );
}

function EmptyState({ title, body, actions }: any) {
  return (
    <div className="border-y border-[#11182B]/10 py-8">
      <h3 className="text-lg font-semibold text-[#11182B]">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#6E7785]">{body}</p>
      <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function Row({ title, detail, actions }: any) {
  return (
    <article className="grid gap-3 border-y border-[#11182B]/10 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <h3 className="text-sm font-semibold text-[#11182B]">{title}</h3>
        <p className="mt-1 text-sm text-[#6E7785]">{detail}</p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </article>
  );
}

function IconButton({ label, onClick, icon }: any) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center bg-white text-[#11182B] shadow-[0_12px_32px_rgba(17,24,43,0.08)] hover:text-[#C5A028]">
      {icon}
    </button>
  );
}

function AuditTrail({ logs }: any) {
  return (
    <div className="mt-6 border-t border-[#11182B]/10 pt-5">
      <h3 className="text-sm font-semibold">Audit trail</h3>
      <div className="mt-3 grid gap-2">
        {logs.slice(0, 6).map((log: any) => (
          <p key={log.id} className="text-sm text-[#6E7785]">
            <span className="font-semibold text-[#11182B]">{log.action}</span> {log.detail ? `• ${log.detail}` : ''} <span className="text-xs">{log.timestamp?.slice(0, 16) || log.created_at?.slice(0, 16)}</span>
          </p>
        ))}
        {!logs.length && <p className="text-sm text-[#6E7785]">No building updates yet. Changes made here will appear in this list.</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="grid gap-1 text-[11px] font-bold uppercase text-[#6E7785]">
      {label}
      {children}
    </label>
  );
}

function FormGrid({ children, onSubmit, loading }: any) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  );
}

function ProfileForm({ form, setForm, onSubmit, loading }: any) {
  return (
    <FormGrid onSubmit={onSubmit} loading={loading}>
      <Field label="Building Name"><Input required value={form.name || ''} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Address"><Input required value={form.address || ''} onChange={(e: any) => setForm({ ...form, address: e.target.value })} /></Field>
      <Field label="Property Type"><Input value={form.type || ''} onChange={(e: any) => setForm({ ...form, type: e.target.value })} /></Field>
      <Field label="Management Company"><Input value={form.management_company || ''} onChange={(e: any) => setForm({ ...form, management_company: e.target.value })} /></Field>
      <Field label="Partner Status"><Input value={form.partner_status || ''} onChange={(e: any) => setForm({ ...form, partner_status: e.target.value })} /></Field>
      <Field label="Launch Date"><Input type="date" value={form.launch_date || ''} onChange={(e: any) => setForm({ ...form, launch_date: e.target.value })} /></Field>
      <Field label="QR Entry Points"><Input value={form.qr_entry_points || form.accessCode || ''} onChange={(e: any) => setForm({ ...form, qr_entry_points: e.target.value, accessCode: e.target.value })} /></Field>
      <Field label="Amenities"><Input value={form.amenities || ''} onChange={(e: any) => setForm({ ...form, amenities: e.target.value })} placeholder="Pool, Gym, Rooftop" /></Field>
    </FormGrid>
  );
}

function UnitForm({ form, setForm, residents, onSubmit, loading }: any) {
  return (
    <FormGrid onSubmit={onSubmit} loading={loading}>
      <Field label="Unit Number"><Input required value={form.flat_number || ''} onChange={(e: any) => setForm({ ...form, flat_number: e.target.value })} /></Field>
      <Field label="Floor"><Input type="number" value={form.floor || ''} onChange={(e: any) => setForm({ ...form, floor: e.target.value })} /></Field>
      <Field label="Unit Type"><Input value={form.room_type || ''} onChange={(e: any) => setForm({ ...form, room_type: e.target.value })} /></Field>
      <Field label="Beds"><Input type="number" value={form.beds || ''} onChange={(e: any) => setForm({ ...form, beds: e.target.value })} /></Field>
      <Field label="Baths"><Input type="number" value={form.baths || ''} onChange={(e: any) => setForm({ ...form, baths: e.target.value })} /></Field>
      <Field label="Sqft"><Input type="number" value={form.sqft || ''} onChange={(e: any) => setForm({ ...form, sqft: e.target.value })} /></Field>
      <Field label="Occupancy Status"><select className="dp-admin-select" value={form.occupancy_status || 'vacant'} onChange={(e) => setForm({ ...form, occupancy_status: e.target.value })}>{unitStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <Field label="Resident Assigned"><select className="dp-admin-select" value={form.resident_id || ''} onChange={(e) => setForm({ ...form, resident_id: e.target.value })}><option value="">Unassigned</option>{residents.map((resident: any) => <option key={resident.id} value={resident.id}>{resident.name}</option>)}</select></Field>
      <Field label="Move-In Date"><Input type="date" value={form.move_in_date || ''} onChange={(e: any) => setForm({ ...form, move_in_date: e.target.value })} /></Field>
      <Field label="Move-Out Date"><Input type="date" value={form.move_out_date || ''} onChange={(e: any) => setForm({ ...form, move_out_date: e.target.value })} /></Field>
      <Field label="Access Status"><select className="dp-admin-select" value={form.access_status || 'pending'} onChange={(e) => setForm({ ...form, access_status: e.target.value })}>{accessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <Field label="Onboarding Status"><select className="dp-admin-select" value={form.onboarding_status || 'not_started'} onChange={(e) => setForm({ ...form, onboarding_status: e.target.value })}>{onboardingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
    </FormGrid>
  );
}

function ResidentForm({ form, setForm, units, onSubmit, loading }: any) {
  return (
    <FormGrid onSubmit={onSubmit} loading={loading}>
      <Field label="Resident Name"><Input required value={form.name || ''} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><Input required type="email" value={form.email || ''} onChange={(e: any) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Phone"><Input value={form.mobile_number || ''} onChange={(e: any) => setForm({ ...form, mobile_number: e.target.value })} /></Field>
      <Field label="Assigned Unit"><select className="dp-admin-select" value={form.flat_id || ''} onChange={(e) => setForm({ ...form, flat_id: e.target.value })}><option value="">Unassigned</option>{units.map((unit: any) => <option key={unit.id} value={unit.id}>{unit.flat_number}</option>)}</select></Field>
      <Field label="Move-In Date"><Input type="date" value={form.move_in_date || ''} onChange={(e: any) => setForm({ ...form, move_in_date: e.target.value })} /></Field>
      <Field label="Lease End"><Input type="date" value={form.lease_end_date || ''} onChange={(e: any) => setForm({ ...form, lease_end_date: e.target.value })} /></Field>
      <Field label="Resident Status"><Input value={form.resident_status || ''} onChange={(e: any) => setForm({ ...form, resident_status: e.target.value })} /></Field>
      <Field label="Access Status"><select className="dp-admin-select" value={form.access_status || 'pending'} onChange={(e) => setForm({ ...form, access_status: e.target.value })}>{accessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
    </FormGrid>
  );
}

function AmenityForm({ form, setForm, onSubmit, loading }: any) {
  return (
    <FormGrid onSubmit={onSubmit} loading={loading}>
      <Field label="Name"><Input required value={form.name || ''} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Category"><select className="dp-admin-select" value={form.category || 'Other'} onChange={(e) => setForm({ ...form, category: e.target.value })}>{amenityCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
      <Field label="Hours Start"><Input type="time" value={form.hours_start || ''} onChange={(e: any) => setForm({ ...form, hours_start: e.target.value })} /></Field>
      <Field label="Hours End"><Input type="time" value={form.hours_end || ''} onChange={(e: any) => setForm({ ...form, hours_end: e.target.value })} /></Field>
      <Field label="Capacity"><Input type="number" value={form.capacity || ''} onChange={(e: any) => setForm({ ...form, capacity: e.target.value })} /></Field>
      <Field label="Status"><select className="dp-admin-select" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">active</option><option value="disabled">disabled</option><option value="archived">archived</option></select></Field>
      <Field label="Access Rules"><Input value={form.access_rules || ''} onChange={(e: any) => setForm({ ...form, access_rules: e.target.value })} /></Field>
      <Field label="Description"><Input value={form.description || ''} onChange={(e: any) => setForm({ ...form, description: e.target.value })} /></Field>
    </FormGrid>
  );
}

function DocumentForm({ form, setForm, onSubmit, loading }: any) {
  return (
    <FormGrid onSubmit={onSubmit} loading={loading}>
      <Field label="Title"><Input required value={form.title || ''} onChange={(e: any) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Category"><select className="dp-admin-select" value={form.category || 'Welcome Guide'} onChange={(e) => setForm({ ...form, category: e.target.value })}>{documentCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
      <Field label="File Name"><Input value={form.file_name || ''} onChange={(e: any) => setForm({ ...form, file_name: e.target.value })} /></Field>
      <Field label="File URL"><Input value={form.file_url || ''} onChange={(e: any) => setForm({ ...form, file_url: e.target.value })} /></Field>
      <Field label="Version"><Input value={form.version || ''} onChange={(e: any) => setForm({ ...form, version: e.target.value })} /></Field>
      <Field label="Who can see this"><Input value={form.permission_group || ''} onChange={(e: any) => setForm({ ...form, permission_group: e.target.value })} /></Field>
    </FormGrid>
  );
}
