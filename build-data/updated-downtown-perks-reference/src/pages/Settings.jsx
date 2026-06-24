import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Loader2, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/context/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState({
    business_name: '',
    business_logo: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== 'admin') {
        toast.error('Access denied. Admins only.');
      }
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const list = await base44.entities.GlobalSettings.list();
      return list[0] || null;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || '',
        business_logo: settings.business_logo || ''
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.GlobalSettings.update(settings.id, data);
      } else {
        return await base44.entities.GlobalSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalSettings']);
      toast.success('Settings saved successfully!');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, business_logo: file_url }));
      toast.success('Logo uploaded!');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await base44.auth.updateMe({ deleted: true });
      toast.success('Account deletion requested. You will be logged out.');
      setShowDeleteAccountConfirm(false);
      setTimeout(() => {
        base44.auth.logout();
      }, 1500);
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleResetTenantData = async () => {
    setIsResetting(true);
    try {
      const tenants = await base44.entities.Tenant.list();
      
      // Delete all tenants
      for (const tenant of tenants) {
        await base44.entities.Tenant.delete(tenant.id);
      }
      
      queryClient.invalidateQueries(['tenants']);
      toast.success('All tenant data has been reset successfully!');
      setShowResetConfirm(false);
    } catch (error) {
      toast.error('Failed to reset tenant data');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600">Only administrators can access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-navy">
            <SettingsIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gold uppercase tracking-[0.22em] mb-0.5">Settings</p>
            <h1 className="text-2xl font-bold text-navy tracking-tight">Global Settings</h1>
            <p className="text-sm text-textMuted">Configure your business branding and data</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Branding Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-navy mb-4">Branding</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name (English)</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="ApartmentPro"
                      required
                    />
                  </div>



                  <div className="space-y-2">
                    <Label htmlFor="business_logo">Business Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.business_logo && (
                        <img 
                          src={formData.business_logo} 
                          alt="Business Logo" 
                          className="w-16 h-16 object-contain rounded-lg border border-slate-200"
                        />
                      )}
                      <div className="flex-1">
                        <Input
                          id="logo_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logo_upload').click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-navy hover:bg-navySoft"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-red-200 bg-red-50/50">
              <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-red-600 mb-4">
                These actions are irreversible. Please be careful.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Reset Tenant Data</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Delete all tenant records while keeping building structure intact.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowResetConfirm(true)}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Tenant Data
                  </Button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-white rounded-xl p-4 border border-red-200 mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-navy">Delete Account</h3>
                    <p className="text-sm text-textSecondary mt-1">
                      Permanently delete your account, survey history, saved items, and resident card. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <AlertDialog open={showDeleteAccountConfirm} onOpenChange={setShowDeleteAccountConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and sign you out. You will lose access to:
              <br />• Survey history and responses
              <br />• Saved perks and events
              <br />• Your resident card and QR codes
              <br />• All personalized preferences
              <br /><br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="delete_confirm" className="text-sm text-slate-700">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </Label>
            <Input
              id="delete_confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingAccount}
              onClick={() => setDeleteConfirmText('')}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all tenant records but keep your building structure (Buildings, Floors, and Flats).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleResetTenantData}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Yes, Reset All Tenant Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}