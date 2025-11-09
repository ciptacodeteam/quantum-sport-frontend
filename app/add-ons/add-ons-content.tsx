'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainHeader from '@/components/headers/MainHeader';
import Image from 'next/image';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import OpenScheduleModal from '@/components/modals/OpenScheduleModal';

dayjs.locale('id');

export default function AddOnsContent() {
  const [activeTab, setActiveTab] = useState<'coach' | 'raket' | 'ballboy'>('coach');
  const [activeSubTab, setActiveSubTab] = useState<'guided' | 'coaching'>('guided');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 🏟 contoh data lapangan
  const selectedCourts = [
    { id: 1, name: 'Court 1', date: '2025-11-07' },
    { id: 2, name: 'Court 2', date: '2025-11-09' }
  ];

  // 🕓 contoh jadwal
  const mockSchedules = [
    { time: '08:00', available: true },
    { time: '09:00', available: false },
    { time: '10:00', available: true },
    { time: '11:00', available: true }
  ];

  // 👨‍🏫 Data Coach
  const coaches = [
    { id: 1, name: 'Coach Zeky', price: 250000, image: '', type: 'guided' },
    { id: 2, name: 'Coach Andi', price: 250000, image: '', type: 'guided' },
    { id: 3, name: 'Coach Fajar', price: 250000, image: '', type: 'guided' },
    { id: 4, name: 'Coach Riko', price: 250000, image: '', type: 'coaching' }
  ];

  // 🏸 Data Raket
  const [racketQty, setRacketQty] = useState(0);
  const totalRacket = 10;
  const usedRacket = 4;
  const availableRacket = totalRacket - usedRacket;
  const racketPrice = 50000;

  // 🧤 Data Ballboy
  const ballboys = [
    { id: 1, name: 'Ball Boy A', price: 100000, image: '' },
    { id: 2, name: 'Ball Boy B', price: 100000, image: '' }
  ];

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  return (
    <>
      <MainHeader backHref="/" title="Produk Tambahan" withLogo={false} />

      <div className="mx-auto w-11/12 pt-28">
        {/* Tabs utama */}
        <div className="mb-4 flex gap-2">
          {['Coach', 'Raket', 'Ball boy'].map((item) => (
            <Button
              key={item}
              variant={activeTab === item.toLowerCase().replace(' ', '') ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab(item.toLowerCase().replace(' ', '') as any)}
            >
              {item}
            </Button>
          ))}
        </div>

        {/* Subtab Coach */}
        {activeTab === 'coach' && (
          <div className="mb-4 flex gap-2">
            <Button
              variant={activeSubTab === 'guided' ? 'default' : 'outline'}
              onClick={() => setActiveSubTab('guided')}
              className="flex-1"
            >
              Guided Match
            </Button>
            <Button
              variant={activeSubTab === 'coaching' ? 'default' : 'outline'}
              onClick={() => setActiveSubTab('coaching')}
              className="flex-1"
            >
              Coaching
            </Button>
          </div>
        )}

        {/* === COACH LIST === */}
        {activeTab === 'coach' && (
          <div className="mb-4 flex flex-col gap-3">
            {coaches
              .filter((coach) => coach.type === activeSubTab)
              .map((coach) => (
                <Card
                  key={coach.id}
                  onClick={() => handleSelectItem(coach)}
                  className="hover:border-primary cursor-pointer transition"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="shrink-0 overflow-hidden rounded-full bg-gray-200">
                          <Image
                            src={
                              coach.image && coach.image.trim() !== ''
                                ? coach.image
                                : '/assets/img/avatar.webp'
                            }
                            alt={coach.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-semibold">{coach.name}</p>
                          <p className="text-muted-foreground text-xs">Pilih jadwal coach</p>
                        </div>
                      </div>
                      <ChevronRight className="text-primary" />
                    </div>

                    <div className="bg-muted mt-4 flex rounded-sm px-4 py-2">
                      <p className="text-foreground">
                        <span className="text-primary font-semibold">
                          Rp{coach.price.toLocaleString('id-ID')}{' '}
                        </span>
                        <span className="text-muted-foreground text-sm">/sesi</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* === RAKET === */}
        {activeTab === 'raket' && (
          <div className="mb-4 flex flex-col gap-3">
            <Card>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Sewa Raket</p>
                    <p className="text-muted-foreground text-xs">
                      Tersedia {availableRacket} raket
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRacketQty((prev) => Math.max(prev - 1, 0))}
                      disabled={racketQty <= 0}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-6 text-center font-semibold">{racketQty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRacketQty((prev) => Math.min(prev + 1, availableRacket))}
                      disabled={racketQty >= availableRacket}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted mt-4 flex rounded-sm px-4 py-2">
                  <p className="text-foreground">
                    <span className="text-primary font-semibold">
                      Rp{racketPrice.toLocaleString('id-ID')}{' '}
                    </span>
                    <span className="text-muted-foreground text-sm">/raket</span>
                  </p>
                </div>

                {racketQty > 0 && (
                  <p className="text-primary mt-2 text-sm font-medium">
                    Total: Rp
                    {(racketQty * racketPrice).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* === BALLBOY === */}
        {activeTab === 'ballboy' && (
          <div className="mb-4 flex flex-col gap-3">
            {ballboys.map((b) => (
              <Card
                key={b.id}
                onClick={() => handleSelectItem(b)}
                className="hover:border-primary cursor-pointer transition"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="shrink-0 overflow-hidden rounded-full bg-gray-200">
                        <Image
                          src={
                            b.image && b.image.trim() !== '' ? b.image : '/assets/img/avatar.webp'
                          }
                          alt={b.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-muted-foreground text-xs">Pilih jadwal ball boy</p>
                      </div>
                    </div>
                    <ChevronRight className="text-primary" />
                  </div>

                  <div className="bg-muted mt-4 flex rounded-sm px-4 py-2">
                    <p className="text-foreground">
                      <span className="text-primary font-semibold">
                        Rp{b.price.toLocaleString('id-ID')}{' '}
                      </span>
                      <span className="text-muted-foreground text-sm">/sesi</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* === MODAL JADWAL === */}
      <OpenScheduleModal
        open={showModal}
        onOpenChange={setShowModal}
        title={`Pilih Jadwal - ${selectedItem?.name ?? ''}`}
        selectedCourts={selectedCourts}
        schedules={mockSchedules}
        onSelectSchedule={function (): void {
          throw new Error('Function not implemented.');
        }}
      />
    </>
  );
}
