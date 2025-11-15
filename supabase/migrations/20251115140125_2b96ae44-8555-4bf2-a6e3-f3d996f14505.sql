-- Create occurrences table
CREATE TABLE public.occurrences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID NOT NULL,
  occurrence_type TEXT NOT NULL,
  observation TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT occurrences_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own occurrences" 
ON public.occurrences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own occurrences" 
ON public.occurrences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own occurrences" 
ON public.occurrences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own occurrences" 
ON public.occurrences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_occurrences_updated_at
BEFORE UPDATE ON public.occurrences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();