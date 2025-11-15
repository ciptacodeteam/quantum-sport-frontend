'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { adminClubQueryOptions } from '@/queries/admin/club';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft, IconUsers, IconLock, IconWorld, IconCrown, IconCalendar, IconMail } from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const AdminClubDetailPage = () => {
  const params = useParams();
  const clubId = params.id as string;
  const router = useRouter();

  const { data: club, isLoading, isError } = useQuery(adminClubQueryOptions(clubId));

  if (isLoading) {
    return (
      <main>
        <Section>
          <SectionHeader>
            <Button variant="ghost" onClick={() => router.back()}>
              <IconArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </SectionHeader>
          <SectionContent>
            <div className="text-center py-12 text-muted-foreground">
              Loading club details...
            </div>
          </SectionContent>
        </Section>
      </main>
    );
  }

  if (isError || !club) {
    return (
      <main>
        <Section>
          <SectionHeader>
            <Button variant="ghost" onClick={() => router.back()}>
              <IconArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </SectionHeader>
          <SectionContent>
            <div className="text-center py-12 text-destructive">
              Failed to load club details. Please try again.
            </div>
          </SectionContent>
        </Section>
      </main>
    );
  }

  return (
    <main>
      <Section>
        <SectionHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <SectionTitle title="Club Details" />
              <SectionDescription description="View and manage club information" />
            </div>
            <Button variant="ghost" onClick={() => router.back()}>
              <IconArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </div>
        </SectionHeader>

        <SectionContent className="space-y-6">
          {/* Club Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="size-24 rounded-lg">
                  <AvatarImage src={club.logo || undefined} alt={club.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-2xl">
                    {(club.name || 'CL').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{club.name}</h2>
                      <Badge variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                        {club.visibility === 'PUBLIC' ? (
                          <><IconWorld className="size-3 mr-1" /> Public</>
                        ) : (
                          <><IconLock className="size-3 mr-1" /> Private</>
                        )}
                      </Badge>
                      <Badge variant={club.isActive ? 'default' : 'secondary'}>
                        {club.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconUsers className="size-4" />
                        <span>{club._count?.clubMember || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconCalendar className="size-4" />
                        <span>Created {dayjs(club.createdAt).format('DD MMM YYYY')}</span>
                      </div>
                    </div>
                  </div>

                  {club.description && (
                    <div>
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {club.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Club Rules */}
          {club.rules && (
            <Card>
              <CardHeader>
                <CardTitle>Club Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {club.rules}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Leader Information */}
          {club.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCrown className="size-5 text-yellow-500" />
                  Club Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarImage src={club.leader.image || undefined} alt={club.leader.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {(club.leader.name || 'LD').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{club.leader.name}</p>
                    {club.leader.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <IconMail className="size-4" />
                        {club.leader.email}
                      </p>
                    )}
                    {club.leader.phone && (
                      <p className="text-sm text-muted-foreground">
                        {club.leader.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Members ({club.clubMember?.length || club._count?.clubMember || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {club.clubMember && club.clubMember.length > 0 ? (
                <div className="space-y-3">
                  {club.clubMember.map((member: any, index: number) => (
                    <div key={member.user?.id || index}>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="size-12">
                          <AvatarImage src={member.user?.image || undefined} alt={member.user?.name || 'Member'} />
                          <AvatarFallback className="bg-muted">
                            {(member.user?.name || 'M').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.user?.name || 'Unknown Member'}</p>
                          {member.user?.email && (
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          )}
                        </div>
                      </div>
                      {index < club.clubMember.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconUsers className="size-12 mx-auto mb-2 opacity-50" />
                  <p>This club has {club._count?.clubMember || 0} members</p>
                  <p className="text-xs mt-1">Member list not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </SectionContent>
      </Section>
    </main>
  );
};

export default AdminClubDetailPage;
