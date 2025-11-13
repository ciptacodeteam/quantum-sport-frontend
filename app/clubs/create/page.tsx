'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createClubMutationOptions } from '@/mutations/club';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { IconWorld, IconLock } from '@tabler/icons-react';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';

const CreateClubPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE'
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Wait for Zustand to hydrate
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !isAuth) {
      toast.error('Please login to create a club');
      router.push('/clubs');
    }
  }, [isHydrated, isAuth, router]);

  const { mutate: createClub, isPending } = useMutation(
    createClubMutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        router.push(`/clubs/${data.id}`);
      }
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Club name is required');
      return;
    }

    // Create FormData to handle file upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('visibility', formData.visibility);
    formDataToSend.append('isActive', 'true');
    
    if (formData.description.trim()) {
      formDataToSend.append('description', formData.description.trim());
    }
    
    if (formData.rules.trim()) {
      formDataToSend.append('rules', formData.rules.trim());
    }
    
    if (logoFile) {
      formDataToSend.append('logo', logoFile);
    }

    createClub(formDataToSend as any);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Show nothing while checking auth
  if (!isHydrated) {
    return null;
  }

  // Don't render form if not authenticated (will redirect)
  if (!isAuth) {
    return null;
  }

  return (
    <>
      <MainHeader backHref="/clubs" title="Create Club" withLogo={false} />

      <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
        <div className="w-11/12 mx-auto flex-1 py-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Create a New Club</CardTitle>
                <CardDescription>
                  Fill in the details below to create your sports club
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Club Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Club Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Morning Tennis Club"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Club Logo</Label>
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <Avatar className="size-20 rounded-lg">
                        <AvatarImage src={logoPreview} alt="Logo preview" />
                        <AvatarFallback className="rounded-lg">Logo</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{logoFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(logoFile!.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Optional: Upload an image (max 5MB, PNG, JPG, JPEG)
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your club, activities, and goals..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Tell potential members about your club
                  </p>
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  <Label htmlFor="rules">Club Rules</Label>
                  <Textarea
                    id="rules"
                    placeholder="List your club rules here..."
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Set expectations for members
                  </p>
                </div>

                {/* Visibility */}
                <div className="space-y-3">
                  <Label>Club Visibility</Label>
                  <RadioGroup
                    value={formData.visibility}
                    onValueChange={(value) => setFormData({ ...formData, visibility: value as 'PUBLIC' | 'PRIVATE' })}
                  >
                    <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="PUBLIC" id="public" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="public" className="cursor-pointer font-semibold flex items-center gap-2">
                          <IconWorld className="size-4" />
                          Public Club
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Anyone can join without approval
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="PRIVATE" id="private" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="private" className="cursor-pointer font-semibold flex items-center gap-2">
                          <IconLock className="size-4" />
                          Private Club
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Members must request to join and be approved
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isPending}
                    loading={isPending}
                  >
                    Create Club
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </>
  );
};

export default CreateClubPage;
