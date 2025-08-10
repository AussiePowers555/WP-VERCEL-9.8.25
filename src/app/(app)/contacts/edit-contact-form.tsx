"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ContactFrontend as Contact } from "@/lib/database-schema";

interface EditContactFormProps {
    contact: Contact;
    onSave: (contact: Contact) => void;
    onCancel: () => void;
}

export function EditContactForm({ contact, onSave, onCancel }: EditContactFormProps) {
    const [formData, setFormData] = useState<Contact>(contact);
    const [loading, setLoading] = useState(false);

    const contactTypes: Contact['type'][] = ['Client', 'Lawyer', 'Insurer', 'Repairer', 'Rental Company', 'Service Center', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="type">Contact Type</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Contact['type'] })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                    </SelectTrigger>
                    <SelectContent>
                        {contactTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                    id="postcode"
                    value={formData.postcode || ''}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    placeholder="Postcode"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                    id="abn"
                    value={formData.abn || ''}
                    onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                    placeholder="ABN"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </form>
    );
}