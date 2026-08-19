'use client';

import React, { useState } from 'react';
import { ApprovalStatus, DatabaseSchema, Property, PropertyType, Session } from '@/types';
import { exportCSV, exportToWordDoc, fmtMoney, uid } from '@/lib/utils';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { MapPinPicker } from '@/components/ui/MapPinPicker';

interface PropertiesViewProps {
  db: DatabaseSchema;
  session: Session;
  searchQuery: string;
  onUpdateDatabase: (updater: (draft: DatabaseSchema) => void) => void;
  onToast: (msg: string, isErr?: boolean) => void;
  onAskConfirm: (msg: string, onConfirm: () => void) => void;
  onBookShootForProperty: (property: Property) => void;
}

export function PropertiesView({
  db,
  session,
  searchQuery,
  onUpdateDatabase,
  onToast,
  onAskConfirm,
  onBookShootForProperty
}: PropertiesViewProps) {
  const [filter, setFilter] = useState<'all' | 'rent' | 'sale' | PropertyType>('all');
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Property Form State
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<PropertyType>('Apartment');
  const [customType, setCustomType] = useState('');
  const [floors, setFloors] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [unitFloor, setUnitFloor] = useState('');
  const [listing, setListing] = useState<'rent' | 'sale'>('rent');
  const [leaseDuration, setLeaseDuration] = useState('12 months');
  const [furnished, setFurnished] = useState(false);
  const [sqm, setSqm] = useState<number | ''>('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [price, setPrice] = useState<number | ''>('');
  const [fee, setFee] = useState<number | ''>('');
  const [deposit, setDeposit] = useState<number | ''>('');
  const [amenities, setAmenities] = useState('');
  const [notes, setNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<string>('');

  const canApprove = session.role === 'System Administrator' || session.role === 'Property & Broker Manager';

  const P = db.properties;

  let list = P;
  if (filter !== 'all') {
    list = P.filter(p => p.listing === filter || p.type === filter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.amenities.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
    );
  }

  const handleOpenForm = (p?: Property | null) => {
    if (p) {
      setEditingProp(p);
      setName(p.name);
      setOwner(p.owner);
      setPhone(p.phone);
      setType(p.type || 'Apartment');
      setCustomType(p.customType || '');
      setFloors(p.floors || '');
      setBedrooms(p.bedrooms ?? '');
      setUnitFloor(p.unitFloor || '');
      setListing(p.listing);
      setLeaseDuration(p.leaseDuration || '12 months');
      setFurnished(p.furnished);
      setSqm(p.sqm ?? '');
      setAddress(p.address);
      setPin(p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null);
      setPrice(p.price ?? '');
      setFee(p.fee ?? '');
      setDeposit(p.deposit ?? '');
      setAmenities(p.amenities || '');
      setNotes(p.notes || '');
      setRemarks(p.remarks || '');
      setPhotos(p.photos || (p.photo ? [p.photo] : []));
      setAssignedTeamId(p.assignedTeamId || '');
    } else {
      setEditingProp(null);
      setName('');
      setOwner('');
      setPhone('');
      setType('Apartment');
      setCustomType('');
      setFloors('');
      setBedrooms('');
      setUnitFloor('');
      setListing('rent');
      setLeaseDuration('12 months');
      setFurnished(false);
      setSqm('');
      setAddress('');
      setPin(null);
      setPrice('');
      setFee('');
      setDeposit('');
      setAmenities('');
      setNotes('');
      setRemarks('');
      setPhotos([]);
      setAssignedTeamId('');
    }
    setIsFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const img = new Image();
    const rd = new FileReader();

    rd.onload = () => {
      img.onload = () => {
        const c = document.createElement('canvas');
        const s = Math.min(1, 900 / img.width);
        c.width = img.width * s;
        c.height = img.height * s;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL('image/jpeg', 0.72);
          setPhotos(prev => {
            const next = [...prev];
            next[slotIndex] = dataUrl;
            return next;
          });
        }
      };
      img.src = rd.result as string;
    };
    rd.readAsDataURL(f);
  };

  const handleApprovalChange = (id: string, status: ApprovalStatus) => {
    onUpdateDatabase(draft => {
      const p = draft.properties.find(x => x.id === id);
      if (p) {
        p.approvalStatus = status;
        draft.activity.unshift({
          ts: Date.now(),
          text: `Manager ${session.name} marked property ${p.name} as ${status}.`
        });
        onToast(`Property ${p.name} marked as ${status}`);
      }
    });
  };

  const handleSave = () => {
    if (!name.trim() || !owner.trim() || !phone.trim() || !address.trim()) {
      return onToast('Name, owner, phone and address are required.', true);
    }
    if (type === 'Other' && !customType.trim()) {
      return onToast('Please specify the custom property type.', true);
    }

    onUpdateDatabase(draft => {
      const rec: Property = {
        id: editingProp ? editingProp.id : uid(),
        name: name.trim(),
        owner: owner.trim(),
        phone: phone.trim(),
        type,
        customType: type === 'Other' ? customType.trim() : undefined,
        floors: floors.trim(),
        bedrooms: +bedrooms || 0,
        listing,
        leaseDuration: listing === 'rent' ? leaseDuration.trim() : undefined,
        furnished,
        sqm: +sqm || 0,
        address: address.trim(),
        unitFloor: unitFloor.trim(),
        amenities: amenities.trim(),
        price: +price || 0,
        fee: +fee || 0,
        deposit: +deposit || 0,
        lat: pin ? pin.lat : null,
        lng: pin ? pin.lng : null,
        notes: notes.trim(),
        remarks: remarks.trim(),
        photo: photos[0] || null,
        photos: photos.filter(Boolean),
        approvalStatus: editingProp ? editingProp.approvalStatus : canApprove ? 'Approved' : 'Pending',
        assignedTeamId: assignedTeamId || undefined
      };

      if (editingProp) {
        const idx = draft.properties.findIndex(p => p.id === editingProp.id);
        if (idx !== -1) draft.properties[idx] = rec;
      } else {
        draft.properties.push(rec);
        draft.activity.unshift({
          ts: Date.now(),
          text: `Property registered: ${rec.name} (${rec.listing} - ${rec.approvalStatus}).`
        });
      }
      draft.activity = draft.activity.slice(0, 40);
    });

    setIsFormOpen(false);
    onToast('Property saved ✓' + (pin ? ' (pinned)' : ''));
  };

  const handleDelete = (id: string) => {
    onAskConfirm('Delete this property?', () => {
      onUpdateDatabase(draft => {
        draft.properties = draft.properties.filter(p => p.id !== id);
      });
      setSelectedProp(null);
      onToast('Deleted');
    });
  };

  const handleExportWord = () => {
    const cols = ['Property Name', 'Type', 'Owner Name', 'Owner Phone', 'Listing', 'Lease / Terms', 'Price', 'Address', 'Approval Status', 'Notes'];
    const rows = db.properties.map(p => [
      p.name,
      p.type === 'Other' ? `Other (${p.customType || ''})` : p.type,
      p.owner,
      p.phone,
      p.listing.toUpperCase(),
      p.listing === 'rent' ? p.leaseDuration || '12 months' : 'N/A',
      fmtMoney(p.price),
      p.address,
      p.approvalStatus || 'Approved',
      p.notes || '—'
    ]);
    exportToWordDoc('Das Homes Property Listings Report', cols, rows, 'dashomes-properties-report');
  };

  return (
    <section className="view on" id="view-properties">
      <div className="pagehead rise">
        <div>
          <div className="ph-title">Property Registry</div>
          <div className="ph-sub">Approved listings are accessible to Call Center Operators</div>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={handleExportWord} title="Export Word Document">
            📄 Export Word
          </button>
          <button className="btn btn-ghost" onClick={() => exportCSV('properties', db)}>
            ⇩ Export CSV
          </button>
          <button className="btn btn-pri" onClick={() => handleOpenForm(null)}>
            ＋ Register Property
          </button>
        </div>
      </div>

      <div className="prop-stats rise" style={{ animationDelay: '.05s' }}>
        {[
          ['Total', P.length],
          ['For Rent', P.filter(p => p.listing === 'rent').length],
          ['For Sale', P.filter(p => p.listing === 'sale').length],
          ['Apartments', P.filter(p => p.type === 'Apartment').length],
          ['Villas', P.filter(p => p.type === 'Villa').length],
          ['Approved', P.filter(p => (p.approvalStatus || 'Approved') === 'Approved').length]
        ].map((s, i) => (
          <div key={i} className="prop-stat">
            <b>{s[1]}</b>
            <span>{s[0]}</span>
          </div>
        ))}
      </div>

      <div className="chiprow rise" style={{ animationDelay: '.08s', marginBottom: '16px' }}>
        {[
          ['all', 'All'],
          ['rent', 'For Rent'],
          ['sale', 'For Sale'],
          ['Apartment', 'Apartments'],
          ['Villa', 'Villas'],
          ['Townhouse', 'Townhouses'],
          ['Commercial', 'Commercial']
        ].map(([k, l]) => (
          <button
            key={k}
            className={`fchip ${filter === k ? 'on' : ''}`}
            onClick={() => setFilter(k as any)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="prop-grid">
        {list.length ? (
          list.map(p => {
            const status = p.approvalStatus || 'Approved';
            const displayPhoto = p.photos?.[0] || p.photo;
            return (
              <div key={p.id} className="prop-card" onClick={() => setSelectedProp(p)}>
                <div className="prop-ph">
                  {displayPhoto ? <img src={displayPhoto} alt={p.name} /> : <Icon name="home" size={44} />}
                  <div className="prop-badges">
                    <span className={`chip ${p.listing === 'sale' ? 'ch-gold' : 'ch-sage'}`} style={{ border: 'none' }}>
                      {p.listing}
                    </span>
                    <span className="chip ch-blue" style={{ border: 'none' }}>
                      {p.type === 'Other' ? p.customType || 'Other' : p.type}
                    </span>
                    <span className={`chip ${status === 'Approved' ? 'ch-green' : status === 'Pending' ? 'ch-gold' : 'ch-clay'}`} style={{ border: 'none' }}>
                      {status}
                    </span>
                  </div>
                  {!displayPhoto && <span className="noph">NO COVER PHOTO</span>}
                </div>

                <div className="prop-body">
                  <h4>{p.name}</h4>
                  <div className="prop-addr">
                    <Icon name="pin" size={12} /> {p.address}
                  </div>
                  {p.assignedTeamId && (
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      <span className="team-dot" style={{ background: db.teams.find(t => t.id === p.assignedTeamId)?.color || '#2E4632' }} />
                      <b>{db.teams.find(t => t.id === p.assignedTeamId)?.name || 'Assigned Team'}</b>
                    </div>
                  )}
                  <div className="prop-specs">
                    <span>
                      <Icon name="bed" size={13} /> {p.bedrooms || '—'} bd
                    </span>
                    <span>
                      <Icon name="area" size={13} /> {p.sqm || '—'} m²
                    </span>
                    <span>
                      <Icon name="home" size={13} /> {p.floors || p.unitFloor || 'G'}
                    </span>
                  </div>
                  <div className="prop-price">
                    <b>{fmtMoney(p.price)}</b>
                    {p.listing === 'rent' ? <small>/mo · {p.leaseDuration || '12 mo'}</small> : <small>sale</small>}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <Icon name="home" size={40} />
            <p>No properties match this filter.</p>
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      <Modal
        isOpen={selectedProp !== null}
        title="Property File"
        onClose={() => setSelectedProp(null)}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSelectedProp(null)}>
              Close
            </button>
            {canApprove && selectedProp?.approvalStatus === 'Pending' && (
              <>
                <button
                  className="btn btn-gold"
                  onClick={() => {
                    handleApprovalChange(selectedProp.id, 'Approved');
                    setSelectedProp(prev => (prev ? { ...prev, approvalStatus: 'Approved' } : null));
                  }}
                >
                  ✓ Approve Listing
                </button>
                <button
                  className="btn btn-subtle"
                  onClick={() => {
                    handleApprovalChange(selectedProp.id, 'Rejected');
                    setSelectedProp(prev => (prev ? { ...prev, approvalStatus: 'Rejected' } : null));
                  }}
                >
                  ✕ Reject Listing
                </button>
              </>
            )}
            <button
              className="btn btn-sec"
              onClick={() => {
                const pr = selectedProp!;
                setSelectedProp(null);
                onBookShootForProperty(pr);
              }}
            >
              📷 Book photo shoot
            </button>
            <button
              className="btn btn-pri"
              onClick={() => {
                const pr = selectedProp!;
                setSelectedProp(null);
                handleOpenForm(pr);
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (selectedProp) handleDelete(selectedProp.id);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        {selectedProp && (
          <div>
            <div className="detail-hero" style={{ height: '220px', display: 'flex', gap: '8px' }}>
              {(selectedProp.photos?.length ? selectedProp.photos : [selectedProp.photo]).map((ph, idx) =>
                ph ? (
                  <img key={idx} src={ph} alt={`${selectedProp.name} photo ${idx + 1}`} style={{ flex: 1, objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div key={idx} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream2)', borderRadius: '8px' }}>
                    <Icon name="home" size={44} />
                  </div>
                )
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <h3 style={{ font: "700 24px 'Fraunces', serif", color: 'var(--pine)', margin: 0 }}>{selectedProp.name}</h3>
              <span className={`chip ${(selectedProp.approvalStatus || 'Approved') === 'Approved' ? 'ch-green' : 'ch-gold'}`}>
                {selectedProp.approvalStatus || 'Approved'}
              </span>
            </div>

            <div className="prop-addr" style={{ margin: '4px 0 14px' }}>
              <Icon name="pin" size={13} /> {selectedProp.address} {selectedProp.lat != null ? '· pinned' : '· not pinned'}
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'baseline', marginBottom: '14px' }}>
              <b style={{ font: "700 26px 'Fraunces', serif", color: 'var(--gold)' }}>{fmtMoney(selectedProp.price)}</b>
              {selectedProp.listing === 'rent' ? (
                <span className="chip ch-sage" style={{ border: 'none' }}>per month · {selectedProp.leaseDuration || '12 months'}</span>
              ) : (
                <span className="chip ch-gold" style={{ border: 'none' }}>For Sale</span>
              )}
            </div>

            <dl className="spec-grid">
              <div>
                <dt>Property Type</dt>
                <dd>{selectedProp.type === 'Other' ? selectedProp.customType || 'Other' : selectedProp.type}</dd>
              </div>
              <div>
                <dt>Bedrooms</dt>
                <dd>{selectedProp.bedrooms || '—'}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{selectedProp.sqm ? `${selectedProp.sqm} m²` : '—'}</dd>
              </div>
              <div>
                <dt>Furnishing</dt>
                <dd>{selectedProp.furnished ? 'Furnished' : 'Unfurnished'}</dd>
              </div>
            </dl>

            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                background: 'var(--cream2)',
                border: '1px solid var(--sageline)',
                borderRadius: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ font: "700 10px 'Karla', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Owner Info
                </div>
                <b>{selectedProp.owner}</b> <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedProp.phone}</span>
              </div>
              <a className="btn btn-sec btn-sm" href={`tel:${selectedProp.phone}`}>
                <Icon name="phone" /> Call Owner
              </a>
            </div>

            {selectedProp.assignedTeamId && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#f4f7f4',
                  borderRadius: '10px',
                  border: '1px solid var(--sageline)'
                }}
              >
                <div style={{ font: "700 10px 'Karla', sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#2E4632', marginBottom: '4px' }}>
                  Assigned Team & Registered Members for Shoot
                </div>
                {(() => {
                  const t = db.teams.find(x => x.id === selectedProp.assignedTeamId);
                  if (!t) return <div style={{ fontSize: '12px' }}>Assigned Team ID: {selectedProp.assignedTeamId}</div>;
                  return (
                    <div>
                      <div style={{ fontWeight: 700, color: t.color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="team-dot" style={{ background: t.color }} /> {t.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        Team Members: <b>{t.members?.length ? t.members.map(m => `${m.name} (${m.phone})`).join(', ') : t.lead || 'None registered'}</b>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedProp.remarks && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#faf6eb', borderRadius: '8px', borderLeft: '3px solid #B8862B' }}>
                <b style={{ fontSize: '11px', textTransform: 'uppercase', color: '#B8862B', display: 'block' }}>Remarks</b>
                <span style={{ fontSize: '13px' }}>{selectedProp.remarks}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Property Register / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        title={editingProp ? 'Edit Property' : 'Register Property'}
        onClose={() => setIsFormOpen(false)}
        wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-pri" onClick={handleSave}>
              Save Property
            </button>
          </>
        }
      >
        <div className="fgrid">
          <div className="fld full">
            <label>Property Name / Title *</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summit Residential — 4B" />
          </div>

          <div className="fld">
            <label>Owner Name *</label>
            <input className="inp" value={owner} onChange={e => setOwner(e.target.value)} />
          </div>

          <div className="fld">
            <label>Owner Phone Number *</label>
            <input className="inp mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 9…" />
          </div>

          <div className="fld">
            <label>Property Type *</label>
            <select className="inp" value={type} onChange={e => setType(e.target.value as PropertyType)}>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Studio">Studio</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {type === 'Other' && (
            <div className="fld">
              <label>Specify Custom Type *</label>
              <input className="inp" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g. Warehouse, Duplex..." />
            </div>
          )}

          <div className="fld">
            <label>Listing Type *</label>
            <div className="pillgrp">
              <label>
                <input type="radio" name="plist" value="rent" checked={listing === 'rent'} onChange={() => setListing('rent')} />
                <span>Rent</span>
              </label>
              <label>
                <input type="radio" name="plist" value="sale" checked={listing === 'sale'} onChange={() => setListing('sale')} />
                <span>Sale</span>
              </label>
            </div>
          </div>

          {listing === 'rent' ? (
            <>
              <div className="fld">
                <label>Lease Duration</label>
                <input className="inp" value={leaseDuration} onChange={e => setLeaseDuration(e.target.value)} placeholder="e.g. 12 months, 6 months" />
              </div>
              <div className="fld">
                <label>Monthly Rent Price (ETB) *</label>
                <input className="inp" type="number" min="0" value={price} onChange={e => setPrice(e.target.value === '' ? '' : +e.target.value)} />
              </div>
            </>
          ) : (
            <div className="fld full">
              <label>Sale Price (ETB) *</label>
              <input className="inp" type="number" min="0" value={price} onChange={e => setPrice(e.target.value === '' ? '' : +e.target.value)} />
            </div>
          )}

          <div className="fld">
            <label>Bedrooms</label>
            <input className="inp" type="number" min="0" value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : +e.target.value)} />
          </div>

          <div className="fld">
            <label>Size (m²)</label>
            <input className="inp" type="number" min="0" value={sqm} onChange={e => setSqm(e.target.value === '' ? '' : +e.target.value)} />
          </div>

          <div className="fld full">
            <label>Address / Location * (Google Maps Pin integration)</label>
            <input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="Type address or location..." />
          </div>

          <div className="fld full">
            <label>Pin Location on Map</label>
            <MapPinPicker initialPin={pin} onPinChange={newPin => setPin(newPin)} />
          </div>

          <div className="fld full">
            <label>Cover Photos (Up to 2 cover photos)</label>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Cover Photo 1</span>
                <input className="inp" type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 0)} />
                {photos[0] && <img src={photos[0]} alt="Cover 1" style={{ height: '70px', marginTop: '6px', borderRadius: '6px' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Cover Photo 2</span>
                <input className="inp" type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 1)} />
                {photos[1] && <img src={photos[1]} alt="Cover 2" style={{ height: '70px', marginTop: '6px', borderRadius: '6px' }} />}
              </div>
            </div>
          </div>

          <div className="fld full">
            <label>Assigned Daily Field Team & Members</label>
            <select className="inp" value={assignedTeamId} onChange={e => setAssignedTeamId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {db.teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.members?.length ? t.members.map(m => m.name).join(', ') : t.lead || 'No members'})
                </option>
              ))}
            </select>
          </div>

          <div className="fld full">
            <label>Remarks</label>
            <textarea className="inp" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Manager remarks or special instructions..." />
          </div>
        </div>
      </Modal>
    </section>
  );
}
