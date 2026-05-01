import { supabase } from '@/lib/supabase';
import { LandRecord } from '@/types';

export type DbRecord = Omit<LandRecord, 'fileUrl'> & { file_url?: string };

export async function saveRecord(record: DbRecord): Promise<DbRecord | null> {
  console.log('=== SAVE RECORD START ===');
  console.log('Record ID (before):', record.id);
  
  const insertData = {
    file_name: record.fileName,
    file_url: record.file_url || null,
    file_data: record.fileData || null,
    extraction_date: record.extractionDate,
    land_holding_type: record.landHoldingType,
    village: record.village,
    taluka: record.taluka,
    district: record.district,
    last_mutation_number: record.lastMutationNumber,
    fragment_restriction: record.fragmentRestriction,
    ceiling: record.ceiling,
    forest: record.forest,
    inam: record.inam,
    bhudan: record.bhudan,
    gavthan: record.gavthan,
    total_area: record.totalArea,
    user_id: record.userId,
    raw_text: record.rawText || null,
    confidence_score: record.confidenceScore || null,
    is_edited: (record as any).isEdited || false,
  };
  
  console.log('Insert data:', JSON.stringify(insertData, null, 2));
  
  // Let Supabase auto-generate the UUID
  const { data, error } = await supabase
    .from('land_records')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('=== SAVE ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    return null;
  }
  console.log('=== SAVE SUCCESS ===');
  console.log('Saved data:', data);
  return mapDbRecord(data);
}

export async function updateRecord(id: string, updates: Partial<DbRecord>): Promise<boolean> {
  const fields: Record<string, any> = {};
  if (updates.fileName !== undefined) fields.file_name = updates.fileName;
  if (updates.file_url !== undefined) fields.file_url = updates.file_url;
  if (updates.fileData !== undefined) fields.file_data = updates.fileData;
  if (updates.extractionDate !== undefined) fields.extraction_date = updates.extractionDate;
  if (updates.landHoldingType !== undefined) fields.land_holding_type = updates.landHoldingType;
  if (updates.village !== undefined) fields.village = updates.village;
  if (updates.taluka !== undefined) fields.taluka = updates.taluka;
  if (updates.district !== undefined) fields.district = updates.district;
  if (updates.lastMutationNumber !== undefined) fields.last_mutation_number = updates.lastMutationNumber;
  if (updates.fragmentRestriction !== undefined) fields.fragment_restriction = updates.fragmentRestriction;
  if (updates.ceiling !== undefined) fields.ceiling = updates.ceiling;
  if (updates.forest !== undefined) fields.forest = updates.forest;
  if (updates.inam !== undefined) fields.inam = updates.inam;
  if (updates.bhudan !== undefined) fields.bhudan = updates.bhudan;
  if (updates.gavthan !== undefined) fields.gavthan = updates.gavthan;
  if (updates.totalArea !== undefined) fields.total_area = updates.totalArea;
  if (updates.userId !== undefined) fields.user_id = updates.userId;
  if (updates.rawText !== undefined) fields.raw_text = updates.rawText;
  if (updates.confidenceScore !== undefined) fields.confidence_score = updates.confidenceScore;
  if ((updates as any).isEdited !== undefined) fields.is_edited = (updates as any).isEdited;

  const { error } = await supabase
    .from('land_records')
    .update(fields)
    .eq('id', id);

  if (error) {
    console.error('Update error:', error);
    return false;
  }
  return true;
}

export async function getRecords(): Promise<DbRecord[]> {
  console.log('=== GET RECORDS ===');
  const { data, error } = await supabase
    .from('land_records')
    .select('*')
    .order('extraction_date', { ascending: false });

  if (error) {
    console.error('Fetch error:', error);
    return [];
  }
  console.log('Fetched records:', data?.length || 0);
  return (data || []).map(mapDbRecord);
}

export async function deleteRecord(id: string, filePath?: string): Promise<boolean> {
  const { error } = await supabase
    .from('land_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  return true;
}

function mapDbRecord(data: any): DbRecord {
  return {
    id: data.id,
    fileName: data.file_name,
    file_url: data.file_url,
    fileData: data.file_data,
    extractionDate: data.extraction_date ? new Date(data.extraction_date).toISOString() : '',
    landHoldingType: data.land_holding_type || '',
    village: data.village || '',
    taluka: data.taluka || '',
    district: data.district || '',
    lastMutationNumber: data.last_mutation_number || '',
    fragmentRestriction: data.fragment_restriction || false,
    ceiling: data.ceiling || false,
    forest: data.forest || false,
    inam: data.inam || false,
    bhudan: data.bhudan || false,
    gavthan: data.gavthan || false,
    totalArea: data.total_area || '',
    userId: data.user_id || '',
    rawText: data.raw_text,
    confidenceScore: data.confidence_score,
    isEdited: data.is_edited || false,
  };
}
