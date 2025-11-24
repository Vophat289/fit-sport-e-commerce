import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Post {
  title: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  intro: string;
  content: string;
  image: string;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent {
  isExpanded: boolean[] = [];

  posts: Post[] = [
    {
      title: 'Cách Tập Luyện Hiệu Quả: Hướng Dẫn Toàn Diện Cho Người Mới',
      author: 'FitSport Team',
      date: '19 tháng 11, 2025',
      readTime: '6 phút đọc',
      tags: ['Gym', 'Luyện tập', 'Sức khỏe', 'Dinh dưỡng'],
      intro: 'Tập luyện hiệu quả không chỉ là dành nhiều giờ trong phòng gym, mà là tập đúng cách, nghỉ ngơi và ăn uống hợp lý.',
      content: `
        <h3>1. Lập kế hoạch rõ ràng</h3>
        <p>Bắt đầu bằng mục tiêu cụ thể và chi tiết từng ngày.</p>
        <h3>2. Kỹ thuật đúng</h3>
        <p>Học cách tập chuẩn để tránh chấn thương.</p>
        <h3>3. Dinh dưỡng và nghỉ ngơi</h3>
        <p>Kết hợp chế độ ăn giàu protein và ngủ đủ giấc.</p>
      `,
      image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg'
    },
    {
      title: 'Cách Phối Đồ Thể Thao Đẹp: 5 Tips Đơn Giản Nhưng Đẹp Mắt',
      author: 'FitSport Team',
      date: '20 tháng 11, 2025',
      readTime: '5 phút đọc',
      tags: ['Thời trang', 'Outfit', 'Thể thao'],
      intro: 'Phối đồ thể thao giúp bạn tự tin và thoải mái vận động. 5 tips đơn giản sau sẽ giúp bạn nổi bật hơn.',
      content: `
        <h3>1. Áo vừa form</h3>
        <p>Chọn áo ôm vừa phải, tránh quá rộng hoặc bó sát.</p>
        <h3>2. Màu sắc trung tính</h3>
        <p>Đen – trắng, xám – đen, navy – trắng.</p>
        <h3>3. Quần năng động</h3>
        <p>Jogger, shorts phù hợp chạy bộ và tập luyện.</p>
        <h3>4. Giày thể thao</h3>
        <p>Giày trắng dễ phối, giày neon tạo điểm nhấn.</p>
        <h3>5. Phụ kiện nhẹ nhàng</h3>
        <p>Mũ lưỡi trai, balo mini, smartwatch.</p>
      `,
      image: 'https://images.pexels.com/photos/7679469/pexels-photo-7679469.jpeg'
    },
    {
      title: 'Đi Tập Gym Mặc Gì Cho Phù Hợp? Hướng Dẫn Từ A–Z',
      author: 'FitSport Team',
      date: '21 tháng 11, 2025',
      readTime: '7 phút đọc',
      tags: ['Gym', 'Trang phục', 'Lối sống'],
      intro: 'Chọn trang phục gym phù hợp giúp bạn thoải mái, tăng hiệu suất và tránh chấn thương, giúp bạn thoải mái trong tập luyện.',
      content: `
        <h3>1. Áo thấm hút tốt</h3>
        <p>Dry-fit hoặc polyester giúp thoáng khí và khô nhanh.</p>
        <h3>2. Quần co giãn</h3>
        <p>Jogger hoặc shorts phù hợp từng bài tập.</p>
        <h3>3. Giày phù hợp</h3>
        <p>Chọn giày đúng mục đích: chạy bộ, nâng tạ, cardio.</p>
      `,
      image: 'https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg'
    },
    {
      title: 'Dinh Dưỡng Sau Buổi Tập: Ăn Gì Để Tối Ưu Hóa Cơ Bắp?',
      author: 'FitSport Team',
      date: '22 tháng 11, 2025',
      readTime: '6 phút đọc',
      tags: ['Dinh dưỡng', 'Protein', 'Gym'],
      intro: 'Sau tập, cơ thể cần phục hồi năng lượng và tái tạo cơ bắp. Lựa chọn thực phẩm phù hợp rất quan trọng.',
      content: `
        <h3>1. Protein chất lượng</h3>
        <p>Ức gà, trứng, cá hồi, whey protein giúp cơ bắp phục hồi nhanh.</p>
        <h3>2. Carbs lành mạnh</h3>
        <p>Khoai lang, gạo lứt, bánh mì nguyên cám giúp nạp glycogen.</p>
        <h3>3. Chất béo tốt</h3>
        <p>Hạt, bơ đậu phộng, olive hỗ trợ hấp thụ vitamin.</p>
      `,
      image: 'https://images.pexels.com/photos/5185298/pexels-photo-5185298.jpeg'
    },
    {
      title: 'Chạy Bộ Nên Mặc Gì? Outfit Chuẩn Cho Người Mới',
      author: 'FitSport Team',
      date: '23 tháng 11, 2025',
      readTime: '5 phút đọc',
      tags: ['Chạy bộ', 'Trang phục', 'Cardio'],
      intro: 'Chạy bộ là môn thể thao đơn giản, nhưng cần trang phục phù hợp để đạt hiệu quả và thoải mái.',
      content: `
        <h3>1. Áo chạy bộ</h3>
        <p>Thoáng khí, nhẹ, nhanh khô.</p>
        <h3>2. Quần short phù hợp</h3>
        <p>Co giãn tốt, thoải mái khi di chuyển.</p>
        <h3>3. Giày chạy</h3>
        <p>Chọn theo sải chân, chống sốc, êm chân.</p>
      `,
      image: 'https://images.pexels.com/photos/1199590/pexels-photo-1199590.jpeg'
    },
    {
      title: 'Cân Bằng Giữa Thể Thao, Sức Khỏe Và Ăn Uống',
      author: 'FitSport Team',
      date: '24 tháng 11, 2025',
      readTime: '6 phút đọc',
      tags: ['Sức khỏe', 'Thể thao', 'Dinh dưỡng'],
      intro: 'Cân bằng giữa tập luyện, ăn uống và nghỉ ngơi giúp cơ thể khỏe mạnh, tinh thần minh mẫn và phát triển lâu dài.',
      content: `
        <h3>1. Lịch tập hợp lý</h3>
        <p>Chia đều nhóm cơ, xen kẽ cardio và tập sức mạnh.</p>
        <h3>2. Dinh dưỡng cân đối</h3>
        <p>Protein, carb, chất béo và vitamin cần cân bằng.</p>
        <h3>3. Ngủ đủ giấc</h3>
        <p>Ngủ 7–8 tiếng mỗi đêm để hồi phục cơ thể.</p>
      `,
      image: 'https://prod-cdn.pharmacity.io/blog/co-bap-1.webp'
    },
    {
      title: 'Quần áo cầu lông – Làm sao để chọn bộ đồ nhẹ và thoáng?',
      author: 'FitSport Team',
      date: '2025-11-22',
      readTime: '4 phút đọc',
      tags: ['Cầu lông', 'Quần áo thể thao', 'Thoát mồ hôi'],
      intro: 'Cầu lông đòi hỏi tốc độ và linh hoạt. Bộ trang phục phù hợp giúp bạn thoải mái và tăng hiệu suất thi đấu.',
      content: `
        <h3>1. Chất liệu thoáng khí</h3>
        <p>Polyester pha spandex khô nhanh, nhẹ, thoáng.</p>
        <h3>2. Form áo vừa phải</h3>
        <p>Regular hoặc slim fit, tránh bó quá mức.</p>
        <h3>3. Màu sắc & thương hiệu</h3>
        <p>Hãng Yonex, Lining, Victor nổi tiếng về mẫu mã đẹp và bền.</p>
      `,
      image: 'https://www.acfc.com.vn/acfc_wp/wp-content/uploads/2024/11/choi-cau-long-mac-do-gi.webp'
    },
    {
      title: 'Trang phục chạy bộ – Vì sao quần short thể thao lại quan trọng?',
      author: 'FitSport Team',
      date: '2025-11-22',
      readTime: '5 phút đọc',
      tags: ['Chạy bộ', 'Quần áo thể thao', 'Outdoor'],
      intro: 'Trang phục chạy bộ ảnh hưởng trực tiếp đến sự thoải mái, tốc độ và khả năng duy trì phong độ.',
      content: `
        <h3>1. Chất liệu khô nhanh</h3>
        <p>Dry-fit hoặc QuickDry, co giãn 4 chiều giúp thoải mái.</p>
        <h3>2. Lớp lót chống ma sát</h3>
        <p>Giúp chạy lâu mà không rát chân.</p>
        <h3>3. Túi tiện lợi</h3>
        <p>Túi nhỏ chống nước để đựng chìa khóa hoặc tai nghe.</p>
      `,
      image: 'https://vcdn1-thethao.vnecdn.net/2024/03/20/e3bc150a0c9aa0c4f98b-171090878-1365-9785-1710908876.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=DcF1zE0ucS3l7AGtwL-Aog'
    }
  ];

  constructor() {
    this.isExpanded = Array(this.posts.length).fill(false);
  }

  toggleExpand(index: number) {
    this.isExpanded[index] = !this.isExpanded[index];
  }
}
